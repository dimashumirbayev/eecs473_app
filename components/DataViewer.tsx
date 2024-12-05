import { Text, View, StyleSheet } from "react-native";
import { useFocusEffect } from '@react-navigation/native';
import React, { useEffect, useState, useRef } from "react";
import { Canvas, Path, Skia, SkPath } from "@shopify/react-native-skia";
import { curveBasis, curveLinear, line } from 'd3';
import { Ionicons } from "@expo/vector-icons";
import { getOrientation, getShowIcons, getCalib } from "@/app/(tabs)/settings";

interface DataViewerProps {
    dataString: string;
    source: string,
}

type Coordinate = {
    x: number,
    y: number,
}

const NUM_IMUS = 8
const global_angles : number[] = [0, 0, 0, 0, 0, 0, 0]
export function get_global_angles() : number[] {
    return global_angles
}

export const DataViewer: React.FC<DataViewerProps> = ({ dataString, source }) => {

    const [myShowIcons, setMyShowIcons] = useState(false)
    const [myOrientation, setMyOrientation] = useState(false) // left by default

    useFocusEffect(
        React.useCallback(() => {
          // This callback will be executed when the screen comes into focus
            setMyShowIcons(getShowIcons())
            setMyOrientation(getOrientation())
        }, [myShowIcons, myOrientation])
    );

    const dataStringSplit = dataString.split(" ")

    const pathRef = useRef<SkPath | null>(null);
    const leftPathRef = useRef<SkPath | null>(null);
    const rightPathRef = useRef<SkPath | null>(null);

    let angles : number[] = []
    let deltas : Coordinate[] = []
    let coords : Coordinate[] = [{x: 0,y: 0}]

    // 1. Calculate angles, deltas, and min/max values
    let minX = 0, minY = 0, maxX = 0, maxY = 0
    for (let i = 0; i < NUM_IMUS; i++) {
        const angle = Number(dataStringSplit[i])
        angles.push(angle)

        const distances : number[] = [1.75, 1.75, 1.75, 4.75, 2.375, 2.375, 2.375, 2.375] // should be 8 distances (last one is fake)

        const deltaX = ((myOrientation) ? - Math.cos(angle) : Math.cos(angle)) // * distances[i]
        const deltaY = (-Math.sin(angle)) // * distances[i] // negative to account for flipped coordinate system
        deltas.push({x: deltaX, y: deltaY})

        const prevCoord = coords[coords.length - 1]
        const x = prevCoord.x + deltaX
        const y = prevCoord.y + deltaY
        coords.push({x, y})

        minX = Math.min(minX, x)
        minY = Math.min(minY, y)
        maxX = Math.max(maxX, x)
        maxY = Math.max(maxY, y)
    }

    // Detection for Excessive Forward Lean
    let warnings : string[] = []
    const overallDx = Math.abs(coords[coords.length-1].x - coords[0].x)
    const overallDy = -1 * coords[coords.length-1].y - coords[0].y
    const overallAngle = rad2deg(Math.atan(overallDy / overallDx))
    console.log("overallAngle = ", overallAngle)
    if (overallAngle < 50) {
        warnings.push("Excessive Forward Lean")
    }

    // 2. Calculate center and use this information to scale the data
    const centerX = (maxX + minX) / 2
    const centerY = (maxY + minY) / 2
    const shiftX = 190 - centerX // we need to add shiftX to all coords.x
    const shiftY = 190 - centerY // we need to add shiftY to all coords.y
    const maxRange = Math.max((maxX - minX), (maxY - minY))
    const scaleFactor = 325 / maxRange // map canvas range to data range
    for (let i = 0; i < coords.length; i++) {
        const me = coords[i]
        const newX = ((me.x - centerX) * scaleFactor) + shiftX
        const newY = ((me.y - centerY) * scaleFactor) + shiftY
        coords[i] = {x: newX, y: newY}
    }
    // console.log("shiftX:", shiftX)
    // console.log("shiftY:", shiftY)
    // console.log("scaleFactor:", scaleFactor)

    // 3. Construct left-side and right-side coordinates
    let leftCoords : Coordinate[] = []
    let rightCoords : Coordinate[] = []
    for (let i = 0; i < coords.length; i++) {
        let meDelta = {x:0, y:0}
        if (i == coords.length - 1) { // Last coordinate
            meDelta = deltas[i-1] // Reuse last angle for last coordinate
        } else {
            meDelta = deltas[i]
        }
        const meCoord = coords[i]
        const a = 30 * meDelta.x
        const b = 30 * meDelta.y
        leftCoords.push({x: b + meCoord.x, y: -a + meCoord.y}) // these are flipped due to coordinate system
        rightCoords.push({x: -b + meCoord.x, y: a + meCoord.y})
    }

    // 4. Construct curve for path, leftPath, and rightPath
    const generateCurve = (dataPoints: Coordinate[]) => {
        const lineGenerator = line<{x:number, y:number}>()
            .x((d: { x: any; }) => d.x)
            .y((d: { y: any; }) => d.y)
            .curve(curveBasis)(dataPoints);

        // Generate the path data
        return Skia.Path.MakeFromSVGString(lineGenerator!);
    }
    pathRef.current = generateCurve(coords)
    leftPathRef.current = generateCurve(leftCoords)
    rightPathRef.current = generateCurve(rightCoords)

    // 5. Create function to take a path and return a path that makes part of it
    type coloredPathItem = {
        path: SkPath,
        seg: number,
        color: string,
    }
    let coloredPaths : coloredPathItem[] = []
    function getPathSeg(path : SkPath | null, seg : number, color : string) {
        const c = 0.125
        let trimPath = path!.copy();
        trimPath.trim(c * seg, c * (seg + 1), false);
        coloredPaths.push({path: trimPath, seg: seg, color: color})
    }

    let segColors : {color: string}[] = new Array(NUM_IMUS).fill({color: 'green'})

    let variances : number[] = []

    // 6. TODO: angle stuff
    for (let i = 0; i < NUM_IMUS - 1; i++) {
        // Angle for group i -> group = 2 adjacent segments

        const a = rad2deg(angles[i])
        const b = rad2deg(angles[i+1])
        let bShifted = ((b - a) + 360) % 360
        let ang = 0
        let dir = ""
        if (bShifted < 180) { // bShifted is upward
            ang = 180 - bShifted
            dir = "left"
        } else { // bShifted is downward
            ang = bShifted - 180
            dir = "right"
        }

        // Calculate left-angles and assign to global variable dimash
        let angle_sum = 0
        angles.map((value) => {
            angle_sum += value
        })
        angle_sum /= angles.length
        // console.log("angle sum = ", rad2deg(angle_sum), rad2deg(angles[0]))

        /////////////////////////////////////////////////////////////////////////////
        function AngletoColor(angle : number, dir : string, mode : string, index : number) {
            const ANGLE = dir == "left"? angle : (360 - angle) // angle expressed in left direction
            global_angles[index] = ANGLE

            if (source == "recordings") {
                console.log("Angle", index, "=", ANGLE, "left")
            }

            const ideals : number[] = getCalib()
            // console.log("ideals = ", ideals)

            const red_variances_high : number[] = [180, 180, 180, 180, 180, 180, 180]
            const red_variances_low : number[] = [-180, -180, -180, -180, -180, -180, -180]
            const yellow_variances_high : number[] = [15, 15, 15, 15, 15, 15, 15]
            const yellow_variances_low : number[] = [-15, -15, -15, -15, -15, -15, -15]
            const diff = ANGLE - ideals[index]

            if (index == 0) {
                // console.log("diff = ", diff)
            }
            variances.push(diff)

            if ((diff > red_variances_high[index]) || (diff < red_variances_low[index]) || (index == 0 && ((angles[0]-angle_sum) > 15))) {
                if (dir == "right" && rightPathRef.current != null) {
                    getPathSeg(rightPathRef.current, index, 'red')
                    getPathSeg(rightPathRef.current, index+1, 'red')
                } else if (dir == "left" && leftPathRef.current != null) {
                    getPathSeg(leftPathRef.current, index, 'red')
                    getPathSeg(leftPathRef.current, index+1, 'red')
                }
                segColors[index] = {color: 'red'}
                segColors[index+1] = {color: 'red'}
            } else if ((diff > yellow_variances_high[index]) || (diff < yellow_variances_low[index]) || (index == 0 && ((angles[0]-angle_sum) > 10))) {
                // console.log("index ", index, "thinks diff = ", diff, "high = ", yellow_variances_high[index], "low = ", yellow_variances_low[index])
                if (dir == "right" && rightPathRef.current != null) {
                    getPathSeg(rightPathRef.current, index, 'yellow')
                    getPathSeg(rightPathRef.current, index+1, 'yellow')
                } else if (dir == "left" && leftPathRef.current != null) {
                    getPathSeg(leftPathRef.current, index, 'yellow')
                    getPathSeg(leftPathRef.current, index+1, 'yellow')
                }
                if (segColors[index].color != 'red') {
                    segColors[index] = {color: 'yellow'}
                }
                if (segColors[index+1].color != 'red') {
                    segColors[index+1] = {color: 'yellow'}
                }
            }
        }
        AngletoColor(ang, dir, "Squat", i)

        /////////////////////////////////////////////////////////////////////////////

    }
    // console.log(variances)

    // 7. Interpolate along SkPath to place vertebrae
    type VertebraeCoord = {
        x: number,
        y: number,
        tilt: number, // degrees
        color: string,
    }
    function rad2deg(angle : number) : number {
        return (angle * 180) / 3.1415
    }

    function interpolatePoint(index : number) : VertebraeCoord {
        // index is index of vertebrae, in range [0, 16] -> map these to [1, countPoints-2]
        const path = pathRef.current
        if (path != null) {
            const numPoints = path.countPoints()
            const trueIndex = ((numPoints - 2) * (index / 16)) + 0.99
            const lowerIndex = Math.floor(trueIndex)
            const upperIndex = Math.ceil(trueIndex)
            const lowerPoint = path.getPoint(lowerIndex)
            const upperPoint = path.getPoint(upperIndex)
            const deltaX = upperPoint.x - lowerPoint.x
            const deltaY = upperPoint.y - lowerPoint.y
            const interpX = lowerPoint.x + (deltaX * (trueIndex - lowerIndex))
            const interpY = lowerPoint.y + (deltaY * (trueIndex - lowerIndex))
            const angle = rad2deg(Math.atan(deltaY / deltaX))

            // Set color based on segColors
            const colorIndex = (segColors.length - 1) * (index / 16)
            // console.log(colorIndex)
            const vertColor = segColors[ Math.round(colorIndex) ]

            return {x: interpX, y: interpY, tilt: angle, color: vertColor.color}
        } else {
            return {x: 0, y: 0, tilt: 0, color: 'black'}
        }
    }
    let vertebraePoints : VertebraeCoord[] = []
    for (let i = 0; i < 17; i++) {
        vertebraePoints.push(interpolatePoint(i))
    }

    return (
        <View style={styles.container}>
            <Canvas style={styles.canvas}>
                {pathRef.current && (
                    <Path path={pathRef.current} color="blue" style="stroke" strokeWidth={2} />
                )}
                {/* {leftPathRef.current && (
                    <Path path={leftPathRef.current} color="green" style="stroke" strokeWidth={2} />
                )}
                {rightPathRef.current && (
                    <Path path={rightPathRef.current} color="red" style="stroke" strokeWidth={2} />
                )} */}
                { source != "settings" && (
                    coloredPaths.map((value) => {
                        return <Path path={value.path} color={value.color} style="stroke" strokeWidth={3} />
                    }))
                }
            </Canvas>
            <View style={styles.picturecanvas}>
                { source != "settings" && (warnings.map((value) =>  {
                    {
                        return <View style = {styles.warningcontainer}>
                            <Text style = {{
                            fontSize: 20,
                            color: 'white',
                        }}> {value}
                            </Text>
                        </View>
                    }}))
                }
                {
                    vertebraePoints.map((value) =>  {
                        {
                        if (myShowIcons) {
                            return <View style={{
                                position: 'absolute',
                                top: value.y - 12,
                                left: value.x - 17,
                            }}>
                                <Ionicons
                                name={"tablet-landscape-outline"}
                                size={25}
                                color={ (source == "settings") ? "green" : value.color}
                                style={{
                                    transform: [{ rotate: (value.tilt + 90 )+ 'deg' }]
                                }}
                                />
                            </View>
                            }
                        }
                    })
                }
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    DataViewerContainer: {
        backgroundColor: 'white',
        margin: 10,
        height: 400,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
    },
    container: {
        flex: 1,
        position: 'absolute',
        height: '100%',
        width: '100%',
        borderRadius: 20,
        padding: 10,
        backgroundColor: 'green',
    },
    canvas: {
        position: 'absolute',
        top: 10,
        left: 10,
        borderWidth: 2,
        borderRadius: 10,
        height: '100%',
        width: '100%',
        backgroundColor: '#C0C0C0',
        overflow: 'hidden',
    },
    picturecanvas: {
        borderWidth: 2,
        borderRadius: 10,
        height: '100%',
        width: '100%',
        overflow: 'hidden',
        alignItems: 'center',
    },
    path: {
        top: 100,
    },
    warningcontainer: {
        backgroundColor: 'red',
        borderRadius: 20,
        width: '80%',
        height: 30,
        marginTop: 5,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

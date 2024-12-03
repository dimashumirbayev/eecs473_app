import { Text, View, StyleSheet } from "react-native";
import { useFocusEffect } from '@react-navigation/native';
import React, { useEffect, useState, useRef } from "react";
import { Canvas, Path, Skia, SkPath } from "@shopify/react-native-skia";
import { curveBasis, line } from 'd3';
import { Ionicons } from "@expo/vector-icons";
import { getOrientation, getShowIcons } from "@/app/(tabs)/settings";

interface DataViewerProps {
    dataString: string;
}

type Coordinate = {
    x: number,
    y: number,
}

const NUM_IMUS = 8

export const DataViewer: React.FC<DataViewerProps> = ({ dataString }) => {

    const [myShowIcons, setMyShowIcons] = useState(false)
    const [myOrientation, setMyOrientation] = useState(false) // left by default

    useFocusEffect(
        React.useCallback(() => {
          // This callback will be executed when the screen comes into focus
            setMyShowIcons(getShowIcons())
            setMyOrientation(getOrientation())
        }, [myShowIcons, myOrientation])
    );

    // const dataString = "0.78 0.83 1.24 0.37 1.7 0.48 0.73 0.96 "
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

        const deltaX = (myOrientation) ? - Math.cos(angle) : Math.cos(angle)
        const deltaY = -Math.sin(angle) // negative to account for flipped coordinate system
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

        if (ang < 120) { // red
            if (dir == "right" && rightPathRef.current != null) {
                getPathSeg(rightPathRef.current, i, 'red')
                getPathSeg(rightPathRef.current, i+1, 'red')
            } else if (dir == "left" && leftPathRef.current != null) {
                getPathSeg(leftPathRef.current, i, 'red')
                getPathSeg(leftPathRef.current, i+1, 'red')
            }
            segColors[i] = {color: 'red'}
            segColors[i+1] = {color: 'red'}
        } else if (ang < 150) { // yellow
            if (dir == "right" && rightPathRef.current != null) {
                getPathSeg(rightPathRef.current, i, 'yellow')
                getPathSeg(rightPathRef.current, i+1, 'yellow')
            } else if (dir == "left" && leftPathRef.current != null) {
                getPathSeg(leftPathRef.current, i, 'yellow')
                getPathSeg(leftPathRef.current, i+1, 'yellow')
            }
            if (segColors[i].color != 'red') {
                segColors[i] = {color: 'yellow'}
            }
            if (segColors[i+1].color != 'red') {
                segColors[i+1] = {color: 'yellow'}
            }
        }
    }

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
                    {
                        coloredPaths.map((value) => {
                            return <Path path={value.path} color={value.color} style="stroke" strokeWidth={3} />
                        })
                    }
                </Canvas>
                <View style={styles.picturecanvas}>
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
                                    color={value.color}
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
    },
    path: {
        top: 100,
    },
});

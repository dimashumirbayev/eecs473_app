import { Text, View, StyleSheet } from "react-native";
import { useEffect, useState, useRef } from "react";
import { Canvas, Path, Skia, SkPath } from "@shopify/react-native-skia";
import { curveBasis, line } from 'd3';

interface DataViewerProps {
    value: string;
}

export const DataViewer: React.FC<DataViewerProps> = ({ value }) => {
    const initialX = 100;
    const initialY = 200;
    const hypotenuse = 30;

    const [warnings, setWarnings] = useState<string[]>([])

    let dxVals = [0,0,0,0,0,0,0,0];
    let dyVals = [0,0,0,0,0,0,0,0];

    let angleColorVector = [0,0,0,0,0,0,0,0];

    let maxX = 0;
    let minX = 0;
    let shift = 0;

    const dataRef = useRef([{ x: 0, y: 0, id: 0 }]);

    const pathRef = useRef<SkPath | null>(null);
    const indicatorPathRefs = useRef<({p: SkPath | null; color: string})[]>([{p:null, color: ""}]);

    const data = [
        { x: initialX, y: initialY, id: 0 },
    { x: initialX, y: initialY-(hypotenuse*1), id: 1 },
    { x: initialX, y: initialY-(hypotenuse*2), id: 2 },
    { x: initialX, y: initialY-(hypotenuse*3), id: 3 },
    { x: initialX, y: initialY-(hypotenuse*4), id: 4 },
    { x: initialX, y: initialY-(hypotenuse*5), id: 5 },
    { x: initialX, y: initialY-(hypotenuse*6), id: 6 },
    { x: initialX, y: initialY-(hypotenuse*7), id: 7 },
    { x: initialX, y: initialY-(hypotenuse*8), id: 8 }
  ];

  let rads: string[];
  const calculatePoints = () => {
    rads = value.split(" ");

    dxVals = rads.map(r => Math.cos(+r)*hypotenuse);
    dyVals = rads.map(r => Math.sin(+r)*hypotenuse);

    //take the angle array and convert it to dx and dy values
    //25 is hypotenuse or however u spell it
    dxVals = rads.map(r => Math.cos(+r)*hypotenuse);
    dyVals = rads.map(r => Math.sin(+r)*hypotenuse);

    //initial condition
    dxVals[0] = initialX+dxVals[0];
    dyVals[0] = initialY-dyVals[0];
    minX = initialX;
    maxX = dxVals[0];
    //calc the rest of dx and dy, each subsequent value depend on the sum of all the previous
    //also find max and min now so we dont have to do it later
    for (let i = 1; i < 8; ++i){
      dxVals[i] = dxVals[i-1]+dxVals[i];
      dyVals[i] = (dyVals[i-1]-dyVals[i]);

      //if new val > oldmax, oldmax=new; if new val < oldmin, oldmin=new
      maxX = (dxVals[i] > maxX) ? dxVals[i] : maxX;
      minX = (dxVals[i] < minX) ? dxVals[i] : minX;
    }

    //how much we shift all values by to center image
    //idk how this equation works i just came up with it and it does
    //368 comes from: ipone width 428, canvas margin is 30 each side, 428-30-30
    shift = (368-maxX-minX)/2;
    for (let i = 0; i < 8; ++i){
      dxVals[i] = dxVals[i] + shift;
    }

    //now find good/bad angles
    for (let i = 1; i < 8; ++i){
      //angle at point i
      let ang = Math.abs(3.14-(Math.abs(Number(rads[i])-Number(rads[i-1]))));
      //2 cases red/yellow

      if (ang < 2.09){//red
        angleColorVector[i] = 2;
      }
      else if (ang < 2.62){//yellow
        angleColorVector[i] = 1;
      }
      else {//good angle
        angleColorVector[i] = 0;
      }
    }
  };

  //generates svg curve from data, idk how it works
  const generateCurve = (dataPoints: { x: number; y: number; id: number; }[]) => {
    const lineGenerator = line<{x:number, y:number}>()
      .x((d: { x: any; }) => d.x)
      .y((d: { y: any; }) => d.y)
      .curve(curveBasis)(dataPoints);

    // Generate the path data
    const pathData = Skia.Path.MakeFromSVGString(lineGenerator!);
    //pathData = pathData.
    // Return a valid string path data or an empty string
    return pathData || null;
  };

  const generateIndicatorCurves = (p: SkPath | null) => {
    const c = .125;

    //01 are x min/max, 23 y min/max
    indicatorPathRefs.current = angleColorVector.map((a,  i) => {
      if (a == 1){
        //console.log(i);
        let trimPath = p!.copy();
        trimPath.trim(c*(i-1),c*i, false);
        trimPath.offset(-10, 0);
        return {p: trimPath, color: "yellow"};
      }
      else if (a == 2){
        let trimPath = p!.copy();
        trimPath.trim(c*(i-1),c*i, false);
        trimPath.offset(-10,0);
        return {p: trimPath, color: "red"};
      }
      else{
        return {p: null, color: ""}
      }
    });
  };

  const DisplayIncicatorCurves = () => {
    return indicatorPathRefs.current.map(p => {
        if(p.p != null){
            return <Path path={p.p} color={p.color} style="stroke" strokeWidth={2} />}
        else
            return <></>
        });
  };

    const CubicCurve = () => {
        //updates the data points array based off the dx and dy
        useEffect(() => {
            calculatePoints();

            //creates a new array based off the initail declared data array
            //each index has the switch applied to it, changing that id to the updated val
            const updatedData = data.map(d => {
                switch(d.id) {
                case 0: return { x: initialX+shift,       y: initialY,       id: 0 };
                case 1: return { x: dxVals[0], y: dyVals[0], id: 1 };
                case 2: return { x: dxVals[1], y: dyVals[1], id: 2 };
                case 3: return { x: dxVals[2], y: dyVals[2], id: 3 };
                case 4: return { x: dxVals[3], y: dyVals[3], id: 4 };
                case 5: return { x: dxVals[4], y: dyVals[4], id: 5 };
                case 6: return { x: dxVals[5], y: dyVals[5], id: 6 };
                case 7: return { x: dxVals[6], y: dyVals[6], id: 7 };
                case 8: return { x: dxVals[7], y: dyVals[7], id: 8 };
                default: return d;
                }
            });

            // To avoid unnecessary state updates and re-renders, idk how this works
            if (JSON.stringify(updatedData) !== JSON.stringify(dataRef.current)) {
                dataRef.current = updatedData;
            }
    }, [value]);

    //every time the new data array is updated create a new path
    useEffect(() => {
      //indicatorPathRefs.current = generateIndicatorCurves(dataRef.current);
      pathRef.current = generateCurve(dataRef.current);
      generateIndicatorCurves(pathRef.current);
    }, []);

    //path is returned in the main area idk what its called
    //gets placed at line 158 of this current version of code
    if (pathRef.current != null){
        return (
            <Canvas style={styles.canvas}>
                <Path path={pathRef.current} color="blue" style="stroke" strokeWidth={2} />
                {/* <Path path={"M 158 0 L 158 500"} color="blue" style="stroke" strokeWidth={2}/> */}
                <DisplayIncicatorCurves/>
            </Canvas>
        );
    }
  };
    return (
        <View style={styles.container}>
            <CubicCurve/>
            <Text> {value} </Text>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        position: 'absolute',
        height: '100%',
        width: '100%',
        borderRadius: 20,
        padding: 10,
        backgroundColor: 'green',
    },
    text: {
        fontSize: 18,
    },
    canvas: {
        borderWidth: 2,
        borderRadius: 10,
        height: '100%',
        width: '100%',
        backgroundColor: '#C0C0C0',
        overflow: 'hidden',
    }
});
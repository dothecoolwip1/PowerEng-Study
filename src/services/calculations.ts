export interface GeneratedCalculation { id:string; prompt:string; formulaId:string; knownValues:Array<{symbol:string; value:number; unit:string}>; targetVariable:string; expectedAnswer:number; expectedUnit:string; tolerance:number; solutionSteps:string[]; sourceType:'generated'; sourcePages:number[]; }
const round = (n:number, places=3) => Number(n.toFixed(places));
const ri = (min:number,max:number) => Math.floor(Math.random()*(max-min+1))+min;
export function generateCalculation(formulaId:string):GeneratedCalculation {
  if (formulaId === 'moment') {
    const force = ri(50,900); const distance = ri(5,40)/10; const ans=round(force*distance,2);
    return { id:crypto.randomUUID(), prompt:`A downward force of ${force} N acts ${distance} m to the right of a pivot. Calculate the moment magnitude and state the direction.`, formulaId, knownValues:[{symbol:'F',value:force,unit:'N'},{symbol:'d',value:distance,unit:'m'}], targetVariable:'M', expectedAnswer:ans, expectedUnit:'N·m clockwise', tolerance:0.02, solutionSteps:['We are calculating a turning moment.','Use M = F × perpendicular distance.',`M = ${force} × ${distance}`,`M = ${ans} N·m. A downward force to the right of the pivot tends to rotate the bar clockwise.`], sourceType:'generated', sourcePages:[25] };
  }
  if (formulaId === 'force') {
    const m=ri(10,500); const a=ri(5,60)/10; const ans=round(m*a,2);
    return {id:crypto.randomUUID(),prompt:`A mass of ${m} kg accelerates at ${a} m/s². What force is required?`,formulaId,knownValues:[{symbol:'m',value:m,unit:'kg'},{symbol:'a',value:a,unit:'m/s²'}],targetVariable:'F',expectedAnswer:ans,expectedUnit:'N',tolerance:0.02,solutionSteps:['Target: force.','Use F = ma.',`F = ${m} × ${a}`,`F = ${ans} N.`],sourceType:'generated',sourcePages:[13]};
  }
  if (formulaId === 'pressure') {
    const f=ri(100,5000); const a=ri(5,50)/100; const ans=round(f/a,2);
    return {id:crypto.randomUUID(),prompt:`A force of ${f} N acts uniformly over ${a} m². Calculate the pressure.`,formulaId,knownValues:[{symbol:'F',value:f,unit:'N'},{symbol:'A',value:a,unit:'m²'}],targetVariable:'P',expectedAnswer:ans,expectedUnit:'Pa',tolerance:0.02,solutionSteps:['Target: pressure.','Use P = F/A.',`P = ${f}/${a}`,`P = ${ans} Pa.`],sourceType:'generated',sourcePages:[95]};
  }
  if (formulaId === 'power') {
    const w=ri(2,50)*1000; const t=ri(5,60); const ans=round(w/t,2);
    return {id:crypto.randomUUID(),prompt:`${w} J of work is completed in ${t} s. What power is developed?`,formulaId,knownValues:[{symbol:'W',value:w,unit:'J'},{symbol:'t',value:t,unit:'s'}],targetVariable:'P',expectedAnswer:ans,expectedUnit:'W',tolerance:0.02,solutionSteps:['Target: power.','Use P = W/t.',`P = ${w}/${t}`,`P = ${ans} W.`],sourceType:'generated',sourcePages:[97]};
  }
  return generateCalculation('moment');
}
export function withinTolerance(input:number,expected:number,tolerance=0.02):boolean {
  const allowed=Math.max(Math.abs(expected)*tolerance, 0.01);
  return Math.abs(input-expected)<=allowed;
}

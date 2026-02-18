import React from 'react'
export default function LogTimeline({logs}:{logs:string[]}){
  return (
    <div style={{maxHeight:200, overflow:'auto'}}>
      {logs.map((l,i)=> <div key={i} style={{fontFamily:'monospace'}}>{l}</div>)}
    </div>
  )
}

import { useEffect, useState } from 'react';
import { registerSW } from 'virtual:pwa-register';
export function UpdatePrompt(){const[ready,setReady]=useState(false);const[update,setUpdate]=useState<((reloadPage?:boolean)=>Promise<void>)>();useEffect(()=>{const fn=registerSW({onNeedRefresh(){setReady(true);},onOfflineReady(){}});setUpdate(()=>fn);},[]);if(!ready)return null;return <div className="update-toast"><div><strong>New version available</strong><span>Tap to update.</span></div><button onClick={()=>update?.(true)}>Update</button></div>}

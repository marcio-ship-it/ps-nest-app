// PS Nest browser worker: Python 3.14 (Pyodide 314.0.7) running nest.server.dispatch() for the page.
import { loadPyodide } from 'https://cdn.jsdelivr.net/npm/pyodide@314.0.7/pyodide.mjs';   // module worker: Pyodide 314 dropped classic workers
const post=(type,text)=>self.postMessage({type,text});
let app=null;
const ready=(async()=>{
  try{
    post('status','Loading Python (Pyodide 314.0.7)…');
    const pyodide=await loadPyodide({indexURL:'https://cdn.jsdelivr.net/npm/pyodide@314.0.7/'});
    post('status','Loading the nesting engine…');
    const r=await fetch('app.zip?v=20260924-225032');if(!r.ok)throw new Error('app.zip '+r.status);
    pyodide.unpackArchive(await r.arrayBuffer(),'zip',{extractDir:'/app'});
    pyodide.runPython("import sys; sys.path.insert(0, '/app')");
    app=pyodide.pyimport('nest.webapp');
    post('ready');
  }catch(err){post('fatal',String(err));throw err;}
})();
self.onmessage=async(e)=>{
  const {id,method,path,body}=e.data;
  try{
    await ready;
    const res=app.handle(method,path,body||undefined);
    const [data,status,ctype,filename]=res.toJs({depth:1});res.destroy();
    self.postMessage({id,status,ctype,filename:filename||null,data},[data.buffer]);
  }catch(err){
    self.postMessage({id,status:500,ctype:'application/json',filename:null,data:new TextEncoder().encode(JSON.stringify({error:String(err)}))});
  }
};

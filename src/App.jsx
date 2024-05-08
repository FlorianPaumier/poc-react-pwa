import { OpenLayers }        from "./map/OpenLayers"
import {useEffect, useState} from "react";


function App() {
    const [features, setFeatures] = useState([])
    useEffect(() => {
        const getdata = async () => {
            const req = await fetch("https://localhost")
            const res = await req.json()
            setFeatures(res)
        }
        
        getdata()
    }, []);
    
    
    return <OpenLayers features={features} />
}

export default App

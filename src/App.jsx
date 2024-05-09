import {OpenLayers}                 from "./map/OpenLayers"
import {useEffect, useState} from "react";
import {ToastContainer}             from "react-toastify";


function App() {
	const [features, setFeatures] = useState([])
	useEffect(() => {
		const getdata = async() => {
			const req = await fetch("https://poc.portfoliofpaumier.ovh")
			const res = await req.json()
			setFeatures(res)
		}
		
		getdata()
	}, []);
	
	
	return <>
		<ToastContainer />
		<OpenLayers features={features} />
	</>
}

export default App

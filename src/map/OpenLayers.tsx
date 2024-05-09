import { useEffect, useRef, useState} from 'react'
import Map                           from 'ol/Map'
import View from 'ol/View'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import { transformExtent, get as getProjection } from 'ol/proj'
import TileLayer from 'ol/layer/Tile'
import WMTS                               from 'ol/source/WMTS';
import WMTSTileGrid                       from 'ol/tilegrid/WMTS';
import { singleClick, pointerMove } from 'ol/events/condition'
import Select from 'ol/interaction/Select'
import { Attribution, defaults as defaultControls } from 'ol/control'
import "./OpenLayers.css"

import {getWidth}           from 'ol/extent';
import {Draw, Modify, Snap} from "ol/interaction";
import {GeoJSON} from "ol/format";
import {Coordinate} from "ol/coordinate";
import {toast} from "react-toastify";

const source = new VectorSource({
    wrapX: false,
    format: new GeoJSON()
})

const vectorLayer = new VectorLayer({
    source: source,
    style: {
        'circle-fill-color': 'orange',
        "circle-radius": 10,
        "fill-color": "black",
        "stroke-color": "white",
        "text-value": "Un évenement ici",
        "text-align": "left",
        "text-justify": "right",
        "text-placement": "point",
        "text-scale": 2,
    },
})

const mapClick = new Select({
    condition: singleClick,
})

const mapHover = new Select({
    condition: pointerMove
})

const attribution = new Attribution({
    collapsible: false,
})


const resolutions = [];
const matrixIds = [];
const proj3857 = getProjection('EPSG:3857');
const maxResolution = proj3857 ? getWidth(proj3857.getExtent()) / 256 : 256;

for (let i = 0; i < 20; i++) {
    matrixIds[i] = i.toString();
    resolutions[i] = maxResolution / Math.pow(2, i);
}

const tileGrid = new WMTSTileGrid({
    origin: [-20037508, 20037508],
    resolutions: resolutions,
    matrixIds: matrixIds,
});

// For more information about the IGN API key see
// https://geoservices.ign.fr/blog/2021/01/29/Maj_Cles_Geoservices.html

const ign_source = new WMTS({
    url: 'https://wxs.ign.fr/choisirgeoportail/geoportail/wmts',
    layer: 'GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2',
    matrixSet: 'PM',
    format: 'image/png',
    projection: 'EPSG:3857',
    tileGrid: tileGrid,
    style: 'normal',
    attributions:
        '<a href="https://www.ign.fr/" target="_blank">' +
        '<img src="https://wxs.ign.fr/static/logos/IGN/IGN.gif" title="Institut national de l\'' +
        'information géographique et forestière" alt="IGN"></a>',
});

const ign = new TileLayer({
    source: ign_source,
});

const modify = new Modify({source: source});

type MapProps = {
    features: any[]
}

function formatCoordinate(coordinate: number[]|Coordinate) {
    return <div style={{backgroundColor: "white"}}><table>
      <tbody>
        <tr><th>lon</th><td>{coordinate[0].toFixed(2)}</td></tr>
        <tr><th>lat</th><td>{coordinate[1].toFixed(2)}</td></tr>
      </tbody>
    </table></div>;
}

// eslint-disable-next-line
export function OpenLayers({ features }: MapProps) {
    const [map, setMap] = useState<Map|undefined>(undefined)
    const [center, setCenter] = useState([0, 0])
    const mapRef = useRef(null)


    useEffect(() => {
        if (mapRef.current === null) return

        // create map
        const mapInstance = new Map({
            target: mapRef.current,
            layers: [
                ign,
                vectorLayer,
            ],
            view: new View({
                // projection: 'EPSG:3857', // default is 'EPSG:3857'
                center: [605490.78, 5514336.22],
                zoom: 15,
                minZoom: 10,
                maxZoom: 20,
                extent: transformExtent([-5.1, 41.3, 9.6, 51.1], 'EPSG:4326', 'EPSG:3857') // France limited
            }),
            controls: defaultControls({ attribution: false }).extend([attribution]),
        })

        // click on feature
        mapInstance.addInteraction(mapClick)

        // hover on feature
        mapInstance.addInteraction(mapHover)
        mapInstance.addInteraction(modify);

        mapInstance.on('moveend', function () {
            const view = mapInstance.getView();
            const center = view.getCenter();

            if (center) {
                setCenter(center)
            }
        });
        const draw = new Draw({
            source: source,
            type: "Point",
        });
        mapInstance.addInteraction(draw);
        const snap = new Snap({source: source});
        mapInstance.addInteraction(snap);

        draw.on('drawend', async function (e) {
            // @ts-ignore
            const geometry = e.feature.getGeometry().flatCoordinates;
            const req = await fetch("https://poc.portfoliofpaumier.ovh/point", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({geometry})
            })

            if (!req.ok) {
                toast.error("Erreur lors de l'ajout du point")
                return;
            }

            toast.success("Point ajouté avec succès")
        });

        // check size for the attribution
        function checkWindowSize() {
            const size= mapInstance?.getSize();
            if (!size) return;

            const small =  size[0] < 600
            attribution.setCollapsible(small)
            attribution.setCollapsed(small)
        }

        window.addEventListener('resize', checkWindowSize)
        checkWindowSize()

        // This will free the mapInstance resources on component unmount. This will solve
        // the flickering issue people are having using this code.

        setMap(mapInstance)
        return () => {
            mapInstance.setTarget(undefined)
            window.removeEventListener('resize', checkWindowSize)
        }
    }, [])

    useEffect(() => {

        if (!map || features.length == 0) return

        features.forEach((feature: any) => {
            const geo = JSON.parse(feature.geometry)
            const featureSource = new GeoJSON().readFeature(geo)
            // @ts-ignore
            source.addFeature(featureSource)
        })
    }, [features, map]);

    return (
        <div style={{width: "100%", height: "100%"}}>
            <div ref={mapRef} style={{height: "100%", width: "100%"}}>
            </div>
            <div id="info" style={{position: "absolute", top: "0", "left": 0}}>
                {formatCoordinate(center)}
            </div>
        </div>
    )
}

import L from 'leaflet';
import 'leaflet-routing-machine';

// OpenRouteService Router Adapter
export class OpenRouteServiceRouter {
    private apiKey: string;
    private options: any;

    constructor(apiKey: string, options: any) {
        this.apiKey = apiKey;
        this.options = options || {};
    }

    route(waypoints: any[], callback: any, context: any, options: any) {
        const start = waypoints[0].latLng;
        const end = waypoints[waypoints.length - 1].latLng;

        // Map profile: 'car'->'driving-car', 'bike'->'cycling-regular', 'walk'->'foot-walking'
        let profile = 'driving-car';
        if (this.options.profile === 'bike') profile = 'cycling-regular';
        if (this.options.profile === 'walk') profile = 'foot-walking';

        const url = `https://api.openrouteservice.org/v2/directions/${profile}/geojson`;

        const body = {
            coordinates: [[start.lng, start.lat], [end.lng, end.lat]],
            instructions: true,
            geometry: true,
            preference: 'recommended'
        };

        console.log("🚀 ORS Request:", url, JSON.stringify(body));

        fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': this.apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        })
            .then(response => {
                if (!response.ok) {
                    console.error("ORS HTTP Error:", response.status, response.statusText);
                    return response.text().then(text => { throw new Error(`ORS API Error: ${text}`) });
                }
                return response.json();
            })
            .then(data => {
                if (!data.features || data.features.length === 0) {
                    callback.call(context, {
                        status: 404,
                        message: "No route found"
                    }, []);
                    return;
                }

                const route = data.features[0];
                const coordinates = route.geometry.coordinates.map((c: number[]) => L.latLng(c[1], c[0]));
                const props = route.properties;
                console.log("📍 ORS Response Segments:", props.segments);

                const segment = props.segments && props.segments.length > 0 ? props.segments[0] : null;

                // Map Steps to Instructions with safety checks
                let instructions: any[] = [];
                if (segment && segment.steps) {
                    instructions = segment.steps.map((step: any) => ({
                        type: step.type || 'Straight',
                        text: step.instruction || 'Continue',
                        distance: step.distance || 0,
                        time: step.duration || 0,
                        index: 0
                    }));
                } else {
                    console.warn("⚠️ No steps found in ORS response segment");
                    instructions = [{
                        type: 'Straight',
                        text: 'Follow the route on map',
                        distance: props.summary.distance,
                        time: props.summary.duration,
                        index: 0
                    }];
                }

                // Calculate indices roughly or just provide text
                // For rigorous mapping, we'd need to match instruction way_points to coordinate indices.
                // For now, we pass strict text.

                const result = [{
                    name: props.summary.distance > 1000 ? `${(props.summary.distance / 1000).toFixed(1)} km` : `${Math.round(props.summary.distance)} m`,
                    summary: {
                        totalDistance: props.summary.distance,
                        totalTime: props.summary.duration
                    },
                    coordinates: coordinates,
                    instructions: instructions,
                    waypoints: waypoints,
                    inputWaypoints: waypoints
                }];

                callback.call(context, null, result);
            })
            .catch(err => {
                console.error("ORS Error:", err);
                callback.call(context, {
                    status: 500,
                    message: err.message
                }, []);
            });
    }
}


// LineLayer の緯線経線データを返す。
export const latlonlineGeoJson = (() => {
    const d = 1;  // [°]。精度みたいなもの。
    const dlon = 10;  // [°]。
    const dlat = 10;  // [°]。

    const geojson = {
        type: "FeatureCollection",
        features: [],
    };

    // 経線
    for (let lon = 180; -180 < lon; lon -= dlon) {
        const coordinates = [];
        for (let lat = -80; lat <= 80; lat += d) {
            coordinates.push([lon, lat]);
        }

        const feature = {
            type: "Feature",
            id: geojson.features.length,
            geometry: { type: 'LineString', coordinates: coordinates },
            properties: {},
            info: `${Math.abs(lon)}°${(lon < 0) ? 'W' : 'E'}`
        };
        geojson.features.push(feature);
    }

    // 緯線
    for (let lat = -80; lat < 90; lat += dlat) {
        const coordinates = [];
        for (let lon = -180; lon <= 180; lon += d) {
            coordinates.push([lon, lat]);
        }

        const feature = {
            type: "Feature",
            id: geojson.features.length,
            geometry: { type: 'LineString', coordinates: coordinates },
            properties: {},
            info: `${Math.abs(lat)}°${(lat < 0) ? 'S' : 'N'}`
        };
        geojson.features.push(feature);
    }

    return geojson;
})();


export const figureGeoJson = (() => {
    const smoothness = 0.017444444; // 円の滑らかさ[rad]。0.017444444[rad] = 1[°]
    const geojson = {
        type: "FeatureCollection",
        features: [],
    };

    const c = { x: 0.8, y: 0.0, z: 0.0 };  // 円の中心
    const u = { x: 1.0, y: 0.0, z: 0.0 };  // 円の法線ベクトル
    const r = Math.sqrt(1.0 - c.x * c.x);  // 円の半径
    const vertices = circle(c, u, r, smoothness);

    // const c = { x: 0.0, y: 0.0, z: 0.5 };  // 円の中心
    // const u = { x: 0.0, y: 0.0, z: 1.0 };  // 円の法線ベクトル
    // const r = Math.sqrt(1.0 - c.z * c.z);  // 円の半径
    // const vertices = circle(c, u, r, smoothness);

    // 球座標から緯度経度座標に変換する。
    const coordinates = [];
    for (const vertex of vertices) {
        const s = spherical(vertex);
        coordinates.push([s.phi * 180.0 / Math.PI, 90.0 - s.theta * 180.0 / Math.PI]);
    }

    const feature = {
        type: "Feature",
        id: geojson.features.length,
        geometry: { type: 'LineString', coordinates: coordinates },
        properties: {},
    };
    geojson.features.push(feature);

    return geojson;
})();

// 円の頂点列を返す。
//  c	円の中心
//  u	円の法線ベクトル
//  r	円の半径
//  smoothness	円の滑らかさ[rad]。初期値は0.017444444[rad] = 1[°]
function circle(c, u, r, smoothness) {
    let vertices = [];

    // 底円の頂点を算出する。
    if ((u.x === 0.0 && u.y === 0.0 && u.z === 1.0) || (u.x === 0.0 && u.y === 0.0 && u.z === -1.0)) {
        // Z軸と平行な場合

        for (let t = 0.0; t < 2.0 * Math.PI; t += smoothness) {
            const p = {
                x: r * Math.cos(t),
                y: r * Math.sin(t),
                z: 0.0
            };
            vertices.push({ x: c.x + p.x, y: c.y + p.y, z: c.z + p.z });
        }

    } else {
        // Z軸と平行でない場合

        // 法線ベクトルuの平面上にあって、中心が原点、半径がrの円の平面z=0との交点（2つあるうちの一つ）
        const q = {
            x: u.y / Math.sqrt(u.x * u.x + u.y * u.y) * r,
            y: - u.x / Math.sqrt(u.x * u.x + u.y * u.y) * r,
            z: 0.0
        };

        const s = innerProduct(q, u);

        // 円のある平面を単位ベクトルs,tが直交する座標系で考えると
        // 円周上の点pはp = e + s・cosθ + t・sinθで表される。
        // いろいろ展開して下式を得る。
        for (let t = 0.0; t < 2.0 * Math.PI; t += smoothness) {

            const v = {
                x: q.x * Math.cos(t),
                y: q.y * Math.cos(t),
                z: q.z * Math.cos(t),
            };

            const w = outerProduct(u, {
                x: q.x * Math.sin(t),
                y: q.y * Math.sin(t),
                z: q.z * Math.sin(t),
            });

            const p = {
                x: u.x * (1 - Math.cos(t)) * s + v.x + w.x,
                y: u.y * (1 - Math.cos(t)) * s + v.y + w.y,
                z: u.z * (1 - Math.cos(t)) * s + v.z + w.z,
            };

            vertices.push({ x: c.x + p.x, y: c.y + p.y, z: c.z + p.z });
        }
    }

    return vertices;
}

// 内積（a・b）を返す。
function innerProduct(a, b) {
    return a.x * b.x + a.y * b.y + a.z * b.z;
}

// 外積（a×b）を返す。
function outerProduct(a, b) {
    return {
        x: a.y * b.z - a.z * b.y,
        y: a.z * b.x - a.x * b.z,
        z: a.x * b.y - a.y * b.x
    };
}

// 直交座標から球座標を返す。
function spherical(rectangular) {
    const r = Math.sqrt(rectangular.x * rectangular.x + rectangular.y * rectangular.y + rectangular.z * rectangular.z);
    return {
        r: r,
        theta: Math.acos(rectangular.z / r),
        phi: Math.sign(rectangular.y) * Math.acos(rectangular.x / Math.sqrt(rectangular.x * rectangular.x + rectangular.y * rectangular.y)),
    };
}

// 球座標から直交座標を返す。
function rectangular(spherical) {
    return {
        x: spherical.r * Math.sin(spherical.theta) * Math.cos(spherical.phi),
        y: spherical.r * Math.sin(spherical.theta) * Math.sin(spherical.phi),
        z: spherical.r * Math.cos(spherical.theta)
    };
}



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


export function figureGeoJson(position) {
    if (position == null) {
        return;
    }

    const smoothness = 0.017444444; // 円の滑らかさ[rad]。0.017444444[rad] = 1[°]
    const geojson = {
        type: "FeatureCollection",
        features: [],
    };

    // 円の法線ベクトル
    const u = rectangular(
        {
            r: 1.0,
            theta: (90.0 - position.lat) * Math.PI / 180.0,
            phi: position.lon * Math.PI / 180.0
        });

    const alpha = 20.0 * Math.PI / 180.0;   // 弧で表した半径 [rad]

    // 円の中心
    const c = {
        x: u.x * Math.cos(alpha),
        y: u.y * Math.cos(alpha),
        z: u.z * Math.cos(alpha)
    };

    const r = 1.0 * Math.sin(alpha);  // 円の半径

    const vertices = circle(c, u, r, smoothness);   // 直交座標系での頂点列

    // 直交座標系から緯度経度座標系に変換する。
    const coordinates = [];
    let oldPhi = null;
    for (const vertex of vertices) {
        const s = spherical(vertex);    // 球座標系

        // 180°E, または 180°W をまたぐ場合は、経度方向に同じ符号で延長する。
        let phi = s.phi;
        if (oldPhi != null) {
            const dphi = oldPhi - s.phi
            if (dphi < Math.PI * -1) {
                phi = Math.PI * -2.0 + phi;
            } else if (Math.PI < dphi) {
                phi = Math.PI * 2.0 + phi;
            }
        }

        coordinates.push([phi * 180.0 / Math.PI, 90.0 - s.theta * 180.0 / Math.PI]);

        oldPhi = phi;
    }

    const feature = {
        type: "Feature",
        id: geojson.features.length,
        geometry: { type: 'LineString', coordinates: coordinates },
        properties: {},
    };
    geojson.features.push(feature);

    return geojson;
};

// 円の頂点列を返す。
//  c	円の中心
//  u	円の法線ベクトル
//  r	円の半径
//  smoothness	円の滑らかさ[rad]。
function circle(c, u, r, smoothness) {
    let vertices = [];

    // 底円の頂点を算出する。
    if ((u.x === 0.0 && u.y === 0.0 && u.z === 1.0) || (u.x === 0.0 && u.y === 0.0 && u.z === -1.0)) {
        // Z軸と平行な場合

        for (let t = 0.0; t < 2.0 * Math.PI; t += smoothness) {
            const p = {
                x: c.x + r * Math.cos(t),
                y: c.y + r * Math.sin(t),
                z: c.z + 0.0
            };
            vertices.push(p);
        }

    } else {
        // Z軸と平行でない場合

        // 法線ベクトルuの平面上にあって、中心が原点、半径がrの円の平面z=0との交点（2つあるうちの一つ）
        const v = {
            x: u.y / Math.sqrt(u.x * u.x + u.y * u.y) * r,
            y: - u.x / Math.sqrt(u.x * u.x + u.y * u.y) * r,
            z: 0.0
        };

        // 円周上にあって、q と直交するベクトル
        const w = outerProduct(u, v);

        for (let t = 0.0; t < 2.0 * Math.PI; t += smoothness) {
            // 円のある平面で考えて、円周上の点 P は θ をパラメータとして P = C + S・cosθ + T・sinθ で表される。
            const p = {
                x: c.x + v.x * Math.cos(t) + w.x * Math.sin(t),
                y: c.y + v.y * Math.cos(t) + w.y * Math.sin(t),
                z: c.z + v.z * Math.cos(t) + w.z * Math.sin(t),
            };
            vertices.push(p);
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


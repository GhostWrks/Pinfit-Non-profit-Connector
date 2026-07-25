const EARTH_RADIUS_MILES = 3958.8;

const toRad = (deg) => (deg * Math.PI) / 180;

export const haversineDistanceMiles = (pointA, pointB) => {
  const lat1 = toRad(pointA.lat);
  const lon1 = toRad(pointA.lon);
  const lat2 = toRad(pointB.lat);
  const lon2 = toRad(pointB.lon);

  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.sqrt(a));
};

export const buildSimpleBuffer = (center, radiusMiles, segments = 36) => {
  const points = [];
  const latFactor = 69;
  const lonFactor = 69 * Math.cos((center.lat * Math.PI) / 180);

  for (let i = 0; i < segments; i += 1) {
    const angle = (2 * Math.PI * i) / segments;
    const dLat = (radiusMiles * Math.sin(angle)) / latFactor;
    const dLon = (radiusMiles * Math.cos(angle)) / lonFactor;
    points.push([center.lon + dLon, center.lat + dLat]);
  }

  points.push(points[0]);

  return {
    type: "Polygon",
    coordinates: [points]
  };
};

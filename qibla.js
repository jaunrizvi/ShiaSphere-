/* ShiaSphere - Qibla compass
   Computes the great-circle initial bearing from the user's location to
   the Kaaba (21.4225 N, 39.8262 E), then (where device orientation sensors
   are available and permitted) rotates a compass needle to point at that
   bearing relative to true/magnetic north as reported by the device. */

const Qibla = (() => {
  const KAABA = { lat: 21.4225, lon: 39.8262 };

  function toRad(d) { return d * Math.PI / 180; }
  function toDeg(r) { return r * 180 / Math.PI; }

  function bearingTo(lat1, lon1, lat2, lon2) {
    const phi1 = toRad(lat1), phi2 = toRad(lat2);
    const dLon = toRad(lon2 - lon1);
    const y = Math.sin(dLon) * Math.cos(phi2);
    const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLon);
    let brng = toDeg(Math.atan2(y, x));
    return (brng + 360) % 360;
  }

  let qiblaBearing = null;
  let deviceHeading = null;
  let locationGranted = false;
  let orientationGranted = false;

  function setStatus(msg) {
    const el = document.getElementById('qibla-status');
    if (el) el.textContent = msg;
  }

  function updateNeedle() {
    const needle = document.getElementById('compass-needle');
    const degreesEl = document.getElementById('qibla-degrees');
    if (qiblaBearing === null) return;

    let rotation = qiblaBearing;
    if (deviceHeading !== null) {
      rotation = qiblaBearing - deviceHeading;
    }
    if (needle) needle.style.transform = `translate(-50%, -100%) rotate(${rotation}deg)`;
    if (degreesEl) {
      degreesEl.textContent = deviceHeading !== null
        ? `Qibla: ${Math.round(qiblaBearing)}° from North`
        : `Qibla bearing: ${Math.round(qiblaBearing)}° (hold phone flat & enable orientation for live needle)`;
    }
  }

  function handleOrientation(event) {
    let heading = null;
    if (typeof event.webkitCompassHeading === 'number') {
      // iOS Safari gives compass heading directly
      heading = event.webkitCompassHeading;
    } else if (event.alpha !== null && event.absolute) {
      heading = 360 - event.alpha;
    } else if (event.alpha !== null) {
      heading = 360 - event.alpha; // best-effort; may be relative, not true north
    }
    if (heading !== null) {
      deviceHeading = heading;
      updateNeedle();
    }
  }

  async function enable() {
    setStatus('Requesting location permission…');
    if (!('geolocation' in navigator)) {
      setStatus('Geolocation is not supported on this device/browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(async (pos) => {
      locationGranted = true;
      qiblaBearing = bearingTo(pos.coords.latitude, pos.coords.longitude, KAABA.lat, KAABA.lon);
      setStatus('Location found. Requesting compass/orientation access…');
      updateNeedle();

      // Device orientation (needs explicit permission on iOS 13+)
      if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        try {
          const perm = await DeviceOrientationEvent.requestPermission();
          if (perm === 'granted') {
            orientationGranted = true;
            window.addEventListener('deviceorientation', handleOrientation, true);
            setStatus('Qibla direction live — rotate your phone flat.');
          } else {
            setStatus(`Qibla bearing is ${Math.round(qiblaBearing)}° from true North. Compass sensor access was not granted, so the needle will not rotate live — use a separate compass app alongside this bearing.`);
          }
        } catch (e) {
          setStatus(`Qibla bearing is ${Math.round(qiblaBearing)}° from true North. Could not access the orientation sensor on this device.`);
        }
      } else if ('DeviceOrientationEvent' in window) {
        orientationGranted = true;
        window.addEventListener('deviceorientation', handleOrientation, true);
        setStatus('Qibla direction live — rotate your phone flat.');
      } else {
        setStatus(`Qibla bearing is ${Math.round(qiblaBearing)}° from true North. This device/browser does not expose an orientation sensor — use the bearing with a separate compass.`);
      }
      updateNeedle();
    }, (err) => {
      setStatus(`Location permission was not granted (${err.message}). Qibla direction cannot be shown without your location. You can look up your city's Qibla bearing manually and use a separate compass.`);
    }, { enableHighAccuracy: true, timeout: 10000 });
  }

  function init() {
    document.getElementById('qibla-enable-btn')?.addEventListener('click', enable);
  }

  return { init, bearingTo, KAABA };
})();

document.addEventListener('DOMContentLoaded', Qibla.init);

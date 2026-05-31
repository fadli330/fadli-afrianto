/**
 * GeoPortal Drawing & Digitizing Tool Module
 * Berfungsi untuk menambahkan toolbar Point, Line, Polygon dan backup otomatis ke Google Drive
 */

// Objek penampung global untuk fitur drawing
let drawnItems;
let drawControl;

function initDrawTools(mapInstance, appsScriptUrl) {
    if (!mapInstance) {
        console.error("Map instance tidak ditemukan untuk menginisialisasi Draw Tools.");
        return;
    }

    // 1. Inisialisasi Layer Group khusus untuk menampung hasil digitasi objek baru
    drawnItems = new L.FeatureGroup();
    mapInstance.addLayer(drawnItems);

    // 2. Konfigurasi Toolbar Penggambaran (Leaflet.draw)
    drawControl = new L.Control.Draw({
        edit: {
            featureGroup: drawnItems,
            remove: true
        },
        draw: {
            // Aktifkan Point, Polyline (Line), dan Polygon
            polyline: {
                shapeOptions: { color: '#f59e0b', weight: 4 }
            },
            polygon: {
                shapeOptions: { color: '#10b981', fillColor: '#10b981', fillOpacity: 0.4 }
            },
            circlemarker: {
                radius: 6,
                className: 'custom-draw-point',
                color: '#2563eb',
                fillColor: '#2563eb',
                fillOpacity: 0.8
            },
            // Matikan fitur default yang tidak diperlukan (opsional)
            circle: false,
            rectangle: false,
            marker: false
        }
    });

    // Tambahkan toolbar ke posisi kanan atas peta
    mapInstance.addControl(drawControl);

    // 3. EVENT: Ketika pengguna selesai menggambar objek baru di peta
    mapInstance.on(L.Draw.Event.CREATED, function (e) {
        const layer = e.layer;
        
        // Minta user memasukkan nama/keterangan untuk objek tersebut melalui prompt popup
        let keterangan = prompt("Masukkan nama atau deskripsi objek data baru ini:", "Objek Hasil Digitasi");
        if (keterangan === null) return; // Batalkan jika user menekan cancel

        // Pasang properti atribut ke dalam objek geojson-nya
        layer.feature = layer.feature || {};
        layer.feature.type = "Feature";
        layer.feature.properties = layer.feature.properties || {};
        layer.feature.properties["Nama_Objek"] = keterangan;
        layer.feature.properties["Waktu_Dibuat"] = new Date().toLocaleString();

        // Tambahkan ke layer group di peta
        drawnItems.addLayer(layer);

        // Buat pop-up informasi atribut dasar
        let popupContent = `
            <div style="font-weight:bold; border-bottom:1px solid #444; padding-bottom:4px; margin-bottom:6px;">Digitasi Baru</div>
            <table style="width:100%; font-size:11px;">
                <tr><td style="color:#a0aec0;">Nama:</td><td>${keterangan}</td></tr>
                <tr><td style="color:#a0aec0;">Tipe Spasial:</td><td>${e.layerType}</td></tr>
            </table>
        `;
        layer.bindPopup(popupContent).openPopup();

        // Kirim data spasial baru ini langsung ke Google Drive sebagai backup file JSON (.geojson)
        backupDigitizedDataToDrive(layer.toGeoJSON(), e.layerType, keterangan, appsScriptUrl);
    });
}

/**
 * Fungsi internal untuk mengirim data hasil gambar langsung ke backend Apps Script Google Drive
 */
function backupDigitizedDataToDrive(geoJsonData, layerType, description, urlEndpoint) {
    if (!urlEndpoint || urlEndpoint.includes("AKfycbz...")) {
        console.warn("Sinkronisasi otomatis diabaikan karena URL Apps Script belum valid.");
        return;
    }

    console.log("Mengirim hasil gambar objek ke Google Drive...");
    
    // Siapkan format isi file teks rangkuman data spasial
    const fileName = `Digitasi_${layerType.toUpperCase()}_${description.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.geojson`;
    const stringData = JSON.stringify(geoJsonData, null, 2);
    
    // Lakukan konversi base64 agar aman saat transit API data
    const base64Content = btoa(unescape(encodeURIComponent(stringData)));

    const payload = {
        action: "uploadShp", // Menggunakan endpoint backend yang sama untuk menyimpan file dokumen teks
        fileName: fileName,
        contentType: "application/json",
        base64Data: base64Content
    };

    fetch(urlEndpoint, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify(payload)
    })
    .then(() => {
        console.log(`Objek spasial [${description}] berhasil dicadangkan ke Google Drive!`);
    })
    .catch(err => {
        console.error("Gagal melakukan sinkronisasi otomatis objek baru ke cloud Drive:", err);
    });
}
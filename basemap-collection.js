/**
 * GeoPortal Advanced Basemap Collection Module
 * Menyediakan galeri pilihan Citra Satelit dan Topografi menggunakan Custom Pane
 */

let webGisLayers = {};

function initSatelliteLayer(mapInstance) {
    if (!mapInstance) {
        console.error("Map instance tidak ditemukan untuk menginisialisasi Lapisan Citra & Topografi.");
        return;
    }

    // 1. Buat PANE KHUSUS agar lapisan baru selalu nangkring di atas peta dasar default (CartoDB/OSM)
    // namun tetap berada di bawah data vektor Shapefile (.ZIP) dan hasil gambar digitasi
    if (!mapInstance.getPane('collectionPane')) {
        let collPane = mapInstance.createPane('collectionPane');
        collPane.style.zIndex = 250; // zIndex di antara peta dasar bawaan (200) dan Vektor (400)
        collPane.style.pointerEvents = 'none';
    }

    // 2. Definisikan Berbagai Jenis Provider Citra Satelit dan Topografi
    webGisLayers['esri_satellite'] = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, GeoEye, and the GIS User Community',
        maxZoom: 19, pane: 'collectionPane'
    });

    webGisLayers['google_hybrid'] = L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
        attribution: 'Map data &copy;2026 Google',
        maxZoom: 20, pane: 'collectionPane'
    });

    webGisLayers['opentopo'] = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        attribution: 'Map data: &copy; OSM contributors, SRTM | Map style: &copy; OpenTopoMap (CC-BY-SA)',
        maxZoom: 17, pane: 'collectionPane'
    });

    webGisLayers['usgs_topo'] = L.tileLayer('https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles courtesy of the U.S. Geological Survey',
        maxZoom: 16, pane: 'collectionPane'
    });

    // 3. Buat dan Sisipkan Komponen Antarmuka Kontrol di Sidebar
    const thematicGroupContainer = document.getElementById('group-thematic-list');
    if (thematicGroupContainer) {
        const layerManager = thematicGroupContainer.closest('.layer-group-container').parentNode;
        
        if (!document.getElementById('layer-group-collection')) {
            const collectionContainer = document.createElement('div');
            collectionContainer.className = 'layer-group-container';
            collectionContainer.id = 'layer-group-collection';
            collectionContainer.style.borderLeft = "3px solid #eab308"; // Aksen warna emas untuk galeri peta
            
            collectionContainer.innerHTML = `
                <div class="layer-group-title" style="color: #eab308;">
                    <i class="fa-solid fa-layer-group"></i> Galeri Citra & Topografi
                </div>
                <div class="layer-item" style="padding: 10px; margin-bottom: 0;">
                    
                    <div class="form-row" style="margin-bottom: 10px;">
                        <label style="color: var(--text-muted); font-size: 11px;">Pilih Lapisan Peta:</label>
                        <select id="basemap-collection-select" onchange="switchCollectionLayer(this.value)" style="border-color: #eab308;">
                            <option value="none">-- Sembunyikan Lapisan Tambahan --</option>
                            <option value="esri_satellite">Esri World Imagery (Satelit Murni)</option>
                            <option value="google_hybrid">Google Hybrid (Satelit + Jalan & Label)</option>
                            <option value="opentopo">OpenTopoMap (Topografi & Kontur Eropa/Dunia)</option>
                            <option value="usgs_topo">USGS Topo Map (Topografi Shaded Relief)</option>
                        </select>
                    </div>

                    <div id="collection-opacity-box" style="display: none;">
                        <label id="opacity-label-text" style="font-size: 10px; color: var(--text-muted); display: block; margin-bottom: 2px;">Transparansi Lapisan:</label>
                        <input type="range" id="collection-opacity-range" min="0" max="1" step="0.1" value="1" style="width: 100%; accent-color: #eab308;" oninput="changeCollectionOpacity(this.value)">
                    </div>

                </div>
            `;
            
            // Letakkan di posisi paling atas dalam daftar manajemen layer di sidebar
            layerManager.insertBefore(collectionContainer, layerManager.firstChild);
        }
    }
}

/**
 * Fungsi utama untuk mengganti lapisan aktif berdasarkan pilihan dropdown
 */
function switchCollectionLayer(layerKey) {
    if (!map) return;

    // 1. Matikan dan bersihkan semua lapisan koleksi yang sedang aktif di peta
    for (let key in webGisLayers) {
        if (map.hasLayer(webGisLayers[key])) {
            map.removeLayer(webGisLayers[key]);
        }
    }

    const opacityBox = document.getElementById('collection-opacity-box');
    const opacityRange = document.getElementById('collection-opacity-range');

    // 2. Jika user memilih opsi untuk memunculkan salah satu layer
    if (layerKey !== 'none' && webGisLayers[layerKey]) {
        // Reset slider transparansi ke angka 1 (100% terlihat)
        opacityRange.value = 1;
        webGisLayers[layerKey].setOpacity(1);
        
        // Munculkan layer ke peta
        webGisLayers[layerKey].addTo(map);
        
        // Tampilkan slider kontrol transparansi
        if (opacityBox) opacityBox.style.display = 'block';
    } else {
        // Sembunyikan slider jika memilih opsi "Sembunyikan"
        if (opacityBox) opacityBox.style.display = 'none';
    }
}

/**
 * Fungsi pengatur nilai kepekatan/transparansi lapisan terpilih
 */
function changeCollectionOpacity(value) {
    const activeKey = document.getElementById('basemap-collection-select').value;
    if (activeKey !== 'none' && webGisLayers[activeKey]) {
        webGisLayers[activeKey].setOpacity(parseFloat(value));
    }
}
/**
 * GeoPortal InaRISK BNPB Integration Module - FIXED VERSION
 * Menggunakan WMS / ArcGIS Rest Layer resmi yang lebih stabil untuk Leaflet
 */

let inariskLayers = {};

function initInariskLayers(mapInstance) {
    if (!mapInstance) {
        console.error("Map instance tidak ditemukan untuk menginisialisasi Lapisan InaRISK.");
        return;
    }

    // 1. Buat PANE KHUSUS agar layer bencana dipaksa berada di atas peta dasar / citra satelit
    // tetapi tetap berada di bawah layer Shapefile (.ZIP) milik pengguna
    if (!mapInstance.getPane('inariskPane')) {
        let riskPane = mapInstance.createPane('inariskPane');
        riskPane.style.zIndex = 300; // Berada di atas basemap (250) & di bawah Vektor SHP (400)
        riskPane.style.pointerEvents = 'none'; 
    }

    // 2. Definisikan endpoint WMS / Esri Rest Server InaRISK BNPB yang aktif
    // Menggunakan parameter transparent=true dan format PNG agar peta di bawahnya tetap terlihat
    const inariskWmsUrl = "https://service1.inarisk.bnpb.go.id/arcgis/services/inarisk/ahp_ancaman/MapServer/WMSServer";

    inariskLayers['bencana_banjir'] = L.tileLayer.wms(inariskWmsUrl, {
        layers: '0', // Layer index untuk Banjir
        format: 'image/png',
        transparent: true,
        version: '1.3.0',
        opacity: 0.65,
        pane: 'inariskPane',
        attribution: '&copy; InaRISK BNPB'
    });

    inariskLayers['bencana_gempa'] = L.tileLayer.wms(inariskWmsUrl, {
        layers: '1', // Layer index untuk Gempa Bumi
        format: 'image/png',
        transparent: true,
        version: '1.3.0',
        opacity: 0.65,
        pane: 'inariskPane',
        attribution: '&copy; InaRISK BNPB'
    });

    inariskLayers['bencana_longsor'] = L.tileLayer.wms(inariskWmsUrl, {
        layers: '2', // Layer index untuk Tanah Longsor
        format: 'image/png',
        transparent: true,
        version: '1.3.0',
        opacity: 0.65,
        pane: 'inariskPane',
        attribution: '&copy; InaRISK BNPB'
    });

    inariskLayers['bencana_tsunami'] = L.tileLayer.wms(inariskWmsUrl, {
        layers: '3', // Layer index untuk Tsunami
        format: 'image/png',
        transparent: true,
        version: '1.3.0',
        opacity: 0.65,
        pane: 'inariskPane',
        attribution: '&copy; InaRISK BNPB'
    });

    inariskLayers['bencana_kekeringan'] = L.tileLayer.wms(inariskWmsUrl, {
        layers: '4', // Layer index untuk Kekeringan
        format: 'image/png',
        transparent: true,
        version: '1.3.0',
        opacity: 0.65,
        pane: 'inariskPane',
        attribution: '&copy; InaRISK BNPB'
    });

    // 3. Bangun Antarmuka Kontrol (UI Toggle) di Sidebar
    const thematicGroupContainer = document.getElementById('group-thematic-list');
    if (thematicGroupContainer) {
        const layerManager = thematicGroupContainer.closest('.layer-group-container').parentNode;
        
        // Pastikan tidak membuat duplikat elemen jika fungsi dipanggil ulang
        if (!document.getElementById('layer-group-inarisk')) {
            const riskContainer = document.createElement('div');
            riskContainer.className = 'layer-group-container';
            riskContainer.id = 'layer-group-inarisk';
            riskContainer.style.borderLeft = "3px solid #ef4444"; 
            
            riskContainer.innerHTML = `
                <div class="layer-group-title" style="color: #ef4444;">
                    <i class="fa-solid fa-triangle-exclamation"></i> Peta Rawan Bencana (InaRISK)
                </div>
                <div class="layer-item" style="padding: 10px; margin-bottom: 0;">
                    <p style="font-size: 11px; color: var(--text-muted); margin: 0 0 10px 0; line-height: 1.4;">
                        Data spasial indeks ancaman nasional langsung dari server resmi BNPB (WMS Service).
                    </p>
                    
                    <div class="form-row" style="margin-bottom: 10px;">
                        <select id="inarisk-layer-select" onchange="switchInariskLayer(this.value)" style="border-color: #ef4444;">
                            <option value="none">-- Sembunyikan Peta Bencana --</option>
                            <option value="bencana_banjir">Kawasan Rawan Banjir</option>
                            <option value="bencana_gempa">Kawasan Rawan Gempa Bumi</option>
                            <option value="bencana_longsor">Kawasan Rawan Tanah Longsor</option>
                            <option value="bencana_tsunami">Kawasan Rawan Tsunami</option>
                            <option value="bencana_kekeringan">Kawasan Rawan Kekeringan</option>
                        </select>
                    </div>

                    <div id="inarisk-opacity-box" style="display: none;">
                        <label style="font-size: 10px; color: var(--text-muted); display: block; margin-bottom: 2px;">Transparansi Overlay Bencana:</label>
                        <input type="range" id="inarisk-opacity-range" min="0.1" max="1" step="0.1" value="0.65" style="width: 100%; accent-color: #ef4444;" oninput="changeInariskOpacity(this.value)">
                    </div>
                </div>
            `;
            
            // Sisipkan secara rapi di bawah Galeri Citra & Topografi
            const galleryGroup = document.getElementById('layer-group-collection');
            if (galleryGroup) {
                layerManager.insertBefore(riskContainer, galleryGroup.nextSibling);
            } else {
                layerManager.insertBefore(riskContainer, layerManager.firstChild);
            }
        }
    }
}

/**
 * Mengubah layer bencana aktif di peta menggunakan pemanggilan WMS
 */
function switchInariskLayer(selectedKey) {
    if (!map) return;

    // Bersihkan seluruh layer InaRISK yang menempel di peta
    for (let key in inariskLayers) {
        if (map.hasLayer(inariskLayers[key])) {
            map.removeLayer(inariskLayers[key]);
        }
    }

    const opacityBox = document.getElementById('inarisk-opacity-box');
    const opacityRange = document.getElementById('inarisk-opacity-range');

    if (selectedKey !== 'none' && inariskLayers[selectedKey]) {
        opacityRange.value = 0.65;
        inariskLayers[selectedKey].setOpacity(0.65);
        
        // Tempelkan layer WMS ke peta
        inariskLayers[selectedKey].addTo(map);
        if (opacityBox) opacityBox.style.display = 'block';
    } else {
        if (opacityBox) opacityBox.style.display = 'none';
    }
}

/**
 * Mengatur tingkat transparansi warna peta rawan bencana
 */
function changeInariskOpacity(value) {
    const activeKey = document.getElementById('inarisk-layer-select').value;
    if (activeKey !== 'none' && inariskLayers[activeKey]) {
        inariskLayers[activeKey].setOpacity(parseFloat(value));
    }
}
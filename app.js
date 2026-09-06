// =====================================================
// PKKMB TEKNIK MESIN 2026
// TWIBBON GENERATOR
// =====================================================


// =====================================================
// ELEMENTS
// =====================================================

const canvas = document.getElementById("canvas");

const ctx = canvas.getContext("2d", {
  alpha: true
});

ctx.imageSmoothingEnabled = true;
ctx.imageSmoothingQuality = "high";


const photoInput = document.getElementById("photoInput");

const zoomRange = document.getElementById("zoomRange");
const zoomValue = document.getElementById("zoomValue");

const resetBtn = document.getElementById("resetBtn");
const downloadBtn = document.getElementById("downloadBtn");

const dropZone = document.getElementById("dropZone");

const nameInput = document.getElementById("nameInput");
const originInput = document.getElementById("originInput");

const captionText = document.getElementById("captionText");
const copyCaptionBtn = document.getElementById("copyCaptionBtn");
const captionStatus = document.getElementById("captionStatus");


// =====================================================
// CANVAS SIZE
// =====================================================

const CANVAS_WIDTH = 1080;
const CANVAS_HEIGHT = 1350;


// =====================================================
// ZOOM LIMIT
// =====================================================

const MIN_ZOOM = 0.6;
const MAX_ZOOM = 2.5;


// =====================================================
// TWIBBON OVERLAY
// =====================================================

const overlay = new Image();

overlay.src = "assets/twibbon.png";


// =====================================================
// PHOTO DATA
// =====================================================

let photo = null;
let photoUrl = null;


// =====================================================
// PHOTO AREA
// fallback sebelum transparent area terdeteksi
// =====================================================

let photoArea = {
  x: 240,
  y: 300,
  width: 600,
  height: 700
};


// =====================================================
// PHOTO STATE
// =====================================================

const state = {
  zoom: 1,
  x: 0,
  y: 0
};


// =====================================================
// DRAG STATE
// =====================================================

const drag = {
  active: false,

  pointerId: null,

  startX: 0,
  startY: 0,

  originX: 0,
  originY: 0
};


// =====================================================
// PINCH ZOOM
// =====================================================

const activePointers = new Map();

let pinchStartDistance = null;
let pinchStartZoom = 1;


// =====================================================
// HELPERS
// =====================================================

function clamp(value, min, max) {
  return Math.min(
    Math.max(value, min),
    max
  );
}


// =====================================================
// AUTO DETECT TRANSPARENT PHOTO AREA
// =====================================================

function detectPhotoArea() {

  const detectorCanvas =
    document.createElement("canvas");


  detectorCanvas.width =
    CANVAS_WIDTH;


  detectorCanvas.height =
    CANVAS_HEIGHT;


  const detectorCtx =
    detectorCanvas.getContext(
      "2d",
      {
        willReadFrequently: true
      }
    );


  detectorCtx.clearRect(
    0,
    0,
    CANVAS_WIDTH,
    CANVAS_HEIGHT
  );


  detectorCtx.drawImage(
    overlay,
    0,
    0,
    CANVAS_WIDTH,
    CANVAS_HEIGHT
  );


  const imageData =
    detectorCtx.getImageData(
      0,
      0,
      CANVAS_WIDTH,
      CANVAS_HEIGHT
    );


  const data =
    imageData.data;


  // sampling supaya tetap ringan di HP

  const STEP = 4;


  const gridWidth =
    Math.ceil(
      CANVAS_WIDTH / STEP
    );


  const gridHeight =
    Math.ceil(
      CANVAS_HEIGHT / STEP
    );


  function alphaAtGrid(
    gridX,
    gridY
  ) {

    const x =
      Math.min(
        gridX * STEP,
        CANVAS_WIDTH - 1
      );


    const y =
      Math.min(
        gridY * STEP,
        CANVAS_HEIGHT - 1
      );


    return data[
      (
        y * CANVAS_WIDTH +
        x
      )
      * 4
      + 3
    ];

  }


  // mulai pencarian dari area kiri-tengah,
  // karena layout twibbon final punya area foto di sana

  const centerX =
    Math.floor(
      gridWidth * 0.42
    );


  const centerY =
    Math.floor(
      gridHeight * 0.42
    );


  let startX = null;
  let startY = null;


  const TRANSPARENT_LIMIT = 40;


  // ===================================================
  // FIND TRANSPARENT START POINT
  // ===================================================

  for (
    let radius = 0;
    radius < Math.max(
      gridWidth,
      gridHeight
    );
    radius++
  ) {

    let found =
      false;


    for (
      let y = centerY - radius;
      y <= centerY + radius;
      y++
    ) {

      if (
        y < 0 ||
        y >= gridHeight
      ) {
        continue;
      }


      for (
        let x = centerX - radius;
        x <= centerX + radius;
        x++
      ) {

        if (
          x < 0 ||
          x >= gridWidth
        ) {
          continue;
        }


        const isBorder =
          x === centerX - radius ||
          x === centerX + radius ||
          y === centerY - radius ||
          y === centerY + radius;


        if (!isBorder) {
          continue;
        }


        if (
          alphaAtGrid(
            x,
            y
          )
          <=
          TRANSPARENT_LIMIT
        ) {

          startX = x;
          startY = y;

          found = true;

          break;

        }

      }


      if (found) {
        break;
      }

    }


    if (found) {
      break;
    }

  }


  // ===================================================
  // FALLBACK
  // ===================================================

  if (
    startX === null ||
    startY === null
  ) {

    console.warn(
      "Area transparan tidak ditemukan. Menggunakan area default."
    );

    return;

  }


  // ===================================================
  // FLOOD FILL
  // ===================================================

  const visited =
    new Uint8Array(
      gridWidth *
      gridHeight
    );


  const queueX = [];
  const queueY = [];


  let queueIndex = 0;


  queueX.push(
    startX
  );


  queueY.push(
    startY
  );


  let minX = startX;
  let maxX = startX;

  let minY = startY;
  let maxY = startY;


  while (
    queueIndex <
    queueX.length
  ) {

    const x =
      queueX[
        queueIndex
      ];


    const y =
      queueY[
        queueIndex
      ];


    queueIndex++;


    if (
      x < 0 ||
      y < 0 ||
      x >= gridWidth ||
      y >= gridHeight
    ) {
      continue;
    }


    const index =
      y *
      gridWidth +
      x;


    if (
      visited[
        index
      ]
    ) {
      continue;
    }


    visited[
      index
    ] = 1;


    if (
      alphaAtGrid(
        x,
        y
      )
      >
      TRANSPARENT_LIMIT
    ) {
      continue;
    }


    minX =
      Math.min(
        minX,
        x
      );


    maxX =
      Math.max(
        maxX,
        x
      );


    minY =
      Math.min(
        minY,
        y
      );


    maxY =
      Math.max(
        maxY,
        y
      );


    queueX.push(
      x + 1,
      x - 1,
      x,
      x
    );


    queueY.push(
      y,
      y,
      y + 1,
      y - 1
    );

  }


  // ===================================================
  // GRID TO REAL CANVAS SIZE
  // ===================================================

  let detectedX =
    minX * STEP;


  let detectedY =
    minY * STEP;


  let detectedWidth =
    (
      maxX -
      minX +
      1
    )
    *
    STEP;


  let detectedHeight =
    (
      maxY -
      minY +
      1
    )
    *
    STEP;


  // sedikit masuk ke dalam frame

  const INSET = 6;


  detectedX +=
    INSET;


  detectedY +=
    INSET;


  detectedWidth -=
    INSET * 2;


  detectedHeight -=
    INSET * 2;


  // ===================================================
  // SAFETY CHECK
  // ===================================================

  if (
    detectedWidth < 200 ||
    detectedHeight < 200
  ) {

    console.warn(
      "Area transparan terlalu kecil. Menggunakan area default."
    );

    return;

  }


  photoArea = {
    x: detectedX,
    y: detectedY,
    width: detectedWidth,
    height: detectedHeight
  };


  console.log(
    "Photo area detected:",
    photoArea
  );

}


// =====================================================
// BASE PHOTO SCALE
// =====================================================

function getBasePhotoScale() {

  if (!photo) {
    return 1;
  }


  return Math.max(

    photoArea.width /
    photo.naturalWidth,

    photoArea.height /
    photo.naturalHeight

  );

}


// =====================================================
// DRAW
// =====================================================

function draw() {

  ctx.clearRect(
    0,
    0,
    CANVAS_WIDTH,
    CANVAS_HEIGHT
  );


  // ===================================================
  // USER PHOTO
  // ===================================================

  if (photo) {

    const baseScale =
      getBasePhotoScale();


    const scale =
      baseScale *
      state.zoom;


    const width =
      photo.naturalWidth *
      scale;


    const height =
      photo.naturalHeight *
      scale;


    const centerX =
      photoArea.x +
      photoArea.width / 2;


    const centerY =
      photoArea.y +
      photoArea.height / 2;


    const x =
      centerX -
      width / 2 +
      state.x;


    const y =
      centerY -
      height / 2 +
      state.y;


    ctx.save();


    ctx.imageSmoothingEnabled =
      true;


    ctx.imageSmoothingQuality =
      "high";


    ctx.drawImage(
      photo,
      x,
      y,
      width,
      height
    );


    ctx.restore();

  }


  // ===================================================
  // TWIBBON OVERLAY
  // ===================================================

  if (
    overlay.complete &&
    overlay.naturalWidth > 0
  ) {

    ctx.save();


    ctx.imageSmoothingEnabled =
      true;


    ctx.imageSmoothingQuality =
      "high";


    ctx.drawImage(
      overlay,
      0,
      0,
      CANVAS_WIDTH,
      CANVAS_HEIGHT
    );


    ctx.restore();

  }

}


// =====================================================
// ENABLE / DISABLE EDITOR
// =====================================================

function setEditorEnabled(
  enabled
) {

  zoomRange.disabled =
    !enabled;


  resetBtn.disabled =
    !enabled;


  downloadBtn.disabled =
    !enabled;

}


// =====================================================
// RESET POSITION
// =====================================================

function resetPosition() {

  state.zoom = 1;

  state.x = 0;

  state.y = 0;


  zoomRange.value =
    "1";


  zoomValue.value =
    "100%";


  draw();

}


// =====================================================
// LOAD PHOTO
// =====================================================

function loadPhotoFile(
  file
) {

  if (!file) {
    return;
  }


  if (
    !file.type.startsWith(
      "image/"
    )
  ) {

    alert(
      "File harus berupa gambar."
    );

    return;

  }


  if (photoUrl) {

    URL.revokeObjectURL(
      photoUrl
    );

  }


  photoUrl =
    URL.createObjectURL(
      file
    );


  const img =
    new Image();


  img.onload = () => {

    photo = img;


    setEditorEnabled(
      true
    );


    resetPosition();


    photoInput.value =
      "";

  };


  img.onerror = () => {

    alert(
      "Foto tidak bisa dibuka. Gunakan JPG, PNG, atau WEBP."
    );

  };


  img.src =
    photoUrl;

}


// =====================================================
// OVERLAY LOAD
// =====================================================

overlay.addEventListener(
  "load",
  () => {

    detectPhotoArea();

    draw();

  }
);


// =====================================================
// FILE INPUT
// =====================================================

photoInput.addEventListener(
  "change",
  (event) => {

    const file =
      event.target
        .files?.[0];


    loadPhotoFile(
      file
    );

  }
);


// =====================================================
// ZOOM UI
// =====================================================

function syncZoomUI() {

  state.zoom =
    clamp(
      state.zoom,
      MIN_ZOOM,
      MAX_ZOOM
    );


  zoomRange.value =
    String(
      state.zoom
    );


  zoomValue.value =
    `${Math.round(
      state.zoom *
      100
    )}%`;

}


// =====================================================
// ZOOM SLIDER
// =====================================================

zoomRange.addEventListener(
  "input",
  () => {

    state.zoom =
      Number(
        zoomRange.value
      );


    syncZoomUI();

    draw();

  }
);


// =====================================================
// RESET BUTTON
// =====================================================

resetBtn.addEventListener(
  "click",
  resetPosition
);


// =====================================================
// POINTER TO CANVAS
// =====================================================

function pointerToCanvas(
  event
) {

  const rect =
    canvas.getBoundingClientRect();


  return {

    x:
      (
        event.clientX -
        rect.left
      )
      *
      (
        CANVAS_WIDTH /
        rect.width
      ),

    y:
      (
        event.clientY -
        rect.top
      )
      *
      (
        CANVAS_HEIGHT /
        rect.height
      )

  };

}


// =====================================================
// PINCH DISTANCE
// =====================================================

function getPointerDistance() {

  const pointers =
    Array.from(
      activePointers.values()
    );


  if (
    pointers.length < 2
  ) {
    return null;
  }


  const first =
    pointers[0];


  const second =
    pointers[1];


  return Math.hypot(

    second.clientX -
    first.clientX,

    second.clientY -
    first.clientY

  );

}


// =====================================================
// MOUSE WHEEL ZOOM
// =====================================================

canvas.addEventListener(
  "wheel",

  (event) => {

    if (!photo) {
      return;
    }


    event.preventDefault();


    const change =
      event.deltaY > 0
        ? -0.07
        : 0.07;


    state.zoom +=
      change;


    syncZoomUI();

    draw();

  },

  {
    passive: false
  }
);


// =====================================================
// POINTER DOWN
// =====================================================

canvas.addEventListener(
  "pointerdown",
  (event) => {

    if (!photo) {
      return;
    }


    activePointers.set(
      event.pointerId,
      event
    );


    canvas.setPointerCapture(
      event.pointerId
    );


    // PINCH START

    if (
      activePointers.size === 2
    ) {

      pinchStartDistance =
        getPointerDistance();


      pinchStartZoom =
        state.zoom;


      drag.active =
        false;


      canvas.classList.remove(
        "dragging"
      );


      return;

    }


    // DRAG START

    const point =
      pointerToCanvas(
        event
      );


    drag.active =
      true;


    drag.pointerId =
      event.pointerId;


    drag.startX =
      point.x;


    drag.startY =
      point.y;


    drag.originX =
      state.x;


    drag.originY =
      state.y;


    canvas.classList.add(
      "dragging"
    );

  }
);


// =====================================================
// POINTER MOVE
// =====================================================

canvas.addEventListener(
  "pointermove",
  (event) => {

    if (!photo) {
      return;
    }


    if (
      activePointers.has(
        event.pointerId
      )
    ) {

      activePointers.set(
        event.pointerId,
        event
      );

    }


    // PINCH ZOOM

    if (
      activePointers.size >= 2 &&
      pinchStartDistance
    ) {

      const currentDistance =
        getPointerDistance();


      if (currentDistance) {

        state.zoom =
          pinchStartZoom *
          (
            currentDistance /
            pinchStartDistance
          );


        syncZoomUI();

        draw();

      }


      return;

    }


    // DRAG PHOTO

    if (
      !drag.active ||
      event.pointerId !==
      drag.pointerId
    ) {
      return;
    }


    const point =
      pointerToCanvas(
        event
      );


    state.x =
      drag.originX +
      (
        point.x -
        drag.startX
      );


    state.y =
      drag.originY +
      (
        point.y -
        drag.startY
      );


    draw();

  }
);


// =====================================================
// POINTER END
// =====================================================

function finishPointer(
  event
) {

  activePointers.delete(
    event.pointerId
  );


  if (
    event.pointerId ===
    drag.pointerId
  ) {

    drag.active =
      false;


    drag.pointerId =
      null;


    canvas.classList.remove(
      "dragging"
    );

  }


  if (
    activePointers.size < 2
  ) {

    pinchStartDistance =
      null;

  }

}


canvas.addEventListener(
  "pointerup",
  finishPointer
);


canvas.addEventListener(
  "pointercancel",
  finishPointer
);


// =====================================================
// DRAG & DROP
// =====================================================

[
  "dragenter",
  "dragover"
].forEach(
  (eventName) => {

    dropZone.addEventListener(
      eventName,
      (event) => {

        event.preventDefault();


        dropZone.classList.add(
          "drag-over"
        );

      }
    );

  }
);


[
  "dragleave",
  "drop"
].forEach(
  (eventName) => {

    dropZone.addEventListener(
      eventName,
      (event) => {

        event.preventDefault();


        dropZone.classList.remove(
          "drag-over"
        );

      }
    );

  }
);


dropZone.addEventListener(
  "drop",
  (event) => {

    const file =
      event
        .dataTransfer
        ?.files?.[0];


    loadPhotoFile(
      file
    );

  }
);


// =====================================================
// DOWNLOAD PNG
// =====================================================

downloadBtn.addEventListener(
  "click",
  () => {

    if (!photo) {
      return;
    }


    draw();


    canvas.toBlob(

      (blob) => {

        if (!blob) {
          return;
        }


        const url =
          URL.createObjectURL(
            blob
          );


        const link =
          document.createElement(
            "a"
          );


        link.href =
          url;


        link.download =
          "PKKMB-Teknik-Mesin-Itenas-2026.png";


        document.body.appendChild(
          link
        );


        link.click();


        link.remove();


        setTimeout(
          () => {

            URL.revokeObjectURL(
              url
            );

          },

          1000
        );

      },

      "image/png"

    );

  }
);


// =====================================================
// CAPTION TEMPLATE
// =====================================================

function captionTemplate(
  name,
  origin
) {

  const finalName =
    name ||
    "[NAMA]";


  const finalOrigin =
    origin ||
    "[ASAL SEKOLAH / KOTA]";


  return `I’M READY FOR PKKMB TEKNIK MESIN 2026 ⚙️

Perkenalkan, saya ${finalName} dari ${finalOrigin}.

Mulai tahun ini, saya menjadi bagian dari Teknik Mesin Itenas angkatan 2026.

Selama masa perkuliahan, akan ada banyak hal baru yang saya temui, mulai dari lingkungan, kegiatan, sampai berbagai pengalaman selama menjadi mahasiswa Teknik Mesin Itenas.

Tahun ini menjadi awal masa perkuliahan saya di Institut Teknologi Nasional Bandung.

Sampai bertemu di kampus.

@hmm_itenas

#TeknikMesinItenas2026 #M26`;

}


// =====================================================
// UPDATE CAPTION
// =====================================================

function updateCaption() {

  const name =
    nameInput.value.trim();


  const origin =
    originInput.value.trim();


  captionText.value =
    captionTemplate(
      name,
      origin
    );

}


nameInput.addEventListener(
  "input",
  updateCaption
);


originInput.addEventListener(
  "input",
  updateCaption
);


// =====================================================
// COPY CAPTION
// =====================================================

copyCaptionBtn.addEventListener(
  "click",
  async () => {

    const text =
      captionText.value.trim();


    try {

      await navigator
        .clipboard
        .writeText(
          text
        );

    }

    catch (error) {

      captionText.focus();

      captionText.select();


      document.execCommand(
        "copy"
      );


      window
        .getSelection()
        ?.removeAllRanges();

    }


    captionStatus.textContent =
      "COPIED";


    copyCaptionBtn.classList.add(
      "copied"
    );


    copyCaptionBtn.innerHTML =
      `
        COPIED
        <span>✓</span>
      `;


    setTimeout(
      () => {

        captionStatus.textContent =
          "READY TO COPY";


        copyCaptionBtn.classList.remove(
          "copied"
        );


        copyCaptionBtn.innerHTML =
          `
            COPY CAPTION
            <span>⧉</span>
          `;

      },

      1600
    );

  }
);


// =====================================================
// CLEANUP
// =====================================================

window.addEventListener(
  "beforeunload",
  () => {

    if (photoUrl) {

      URL.revokeObjectURL(
        photoUrl
      );

    }

  }
);


// =====================================================
// INITIAL STATE
// =====================================================

setEditorEnabled(
  false
);

draw();

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d", { alpha: true });

const photoInput = document.getElementById("photoInput");
const zoomRange = document.getElementById("zoomRange");
const zoomValue = document.getElementById("zoomValue");

const resetBtn = document.getElementById("resetBtn");
const downloadBtn = document.getElementById("downloadBtn");

const emptyState = document.getElementById("emptyState");
const dropZone = document.getElementById("dropZone");

const nameInput = document.getElementById("nameInput");
const originInput = document.getElementById("originInput");

const captionText = document.getElementById("captionText");
const copyCaptionBtn = document.getElementById("copyCaptionBtn");
const captionStatus = document.getElementById("captionStatus");


// ======================================================
// CANVAS SIZE
// ======================================================

const CANVAS_WIDTH = 1080;
const CANVAS_HEIGHT = 1350;


// ======================================================
// TWIBBON OVERLAY
// ======================================================

const overlay = new Image();

overlay.src = "assets/twibbon.png";


// ======================================================
// USER PHOTO
// ======================================================

let photo = null;
let photoUrl = null;


// ======================================================
// PHOTO STATE
// ======================================================

const state = {

  zoom: 1,

  x: 0,

  y: 0

};


// ======================================================
// DRAG STATE
// ======================================================

const drag = {

  active: false,

  pointerId: null,

  startX: 0,

  startY: 0,

  originX: 0,

  originY: 0

};


// ======================================================
// PINCH ZOOM
// ======================================================

const activePointers = new Map();

let pinchStartDistance = null;
let pinchStartZoom = 1;


// ======================================================
// CAPTION TEMPLATE
// ======================================================

function captionTemplate(name, origin) {

  const finalName =
    name || "[NAMA]";

  const finalOrigin =
    origin || "[ASAL SEKOLAH / KOTA]";


  return `I’M READY FOR PKKMB TEKNIK MESIN 2026

Perkenalkan, saya ${finalName} dari ${finalOrigin}.

Mulai tahun ini, saya menjadi bagian dari Teknik Mesin Itenas angkatan 2026.

Selama masa perkuliahan nanti, akan ada banyak hal baru yang ditemui, mulai dari lingkungan, kegiatan, sampai berbagai pengalaman selama menjadi mahasiswa Teknik Mesin.

Untuk sekarang, ini menjadi awal masa perkuliahan saya di Itenas.

Sampai bertemu di kampus.

#TeknikMesinItenas2026 #M26`;

}


// ======================================================
// BASIC HELPERS
// ======================================================

function clamp(value, min, max) {

  return Math.min(
    Math.max(value, min),
    max
  );

}


function getCoverScale() {

  if (!photo) {
    return 1;
  }


  return Math.max(

    CANVAS_WIDTH /
    photo.naturalWidth,

    CANVAS_HEIGHT /
    photo.naturalHeight

  );

}


// ======================================================
// DRAW EVERYTHING
// ======================================================

function draw() {

  ctx.clearRect(
    0,
    0,
    CANVAS_WIDTH,
    CANVAS_HEIGHT
  );


  // USER PHOTO
  if (photo) {

    const scale =
      getCoverScale() *
      state.zoom;


    const width =
      photo.naturalWidth *
      scale;


    const height =
      photo.naturalHeight *
      scale;


    const x =
      (CANVAS_WIDTH - width) / 2
      +
      state.x;


    const y =
      (CANVAS_HEIGHT - height) / 2
      +
      state.y;


    ctx.drawImage(
      photo,
      x,
      y,
      width,
      height
    );

  }


  // TWIBBON OVERLAY
  if (
    overlay.complete &&
    overlay.naturalWidth
  ) {

    ctx.drawImage(
      overlay,
      0,
      0,
      CANVAS_WIDTH,
      CANVAS_HEIGHT
    );

  }

}


// ======================================================
// ENABLE / DISABLE EDITOR
// ======================================================

function setEditorEnabled(enabled) {

  zoomRange.disabled =
    !enabled;

  resetBtn.disabled =
    !enabled;

  downloadBtn.disabled =
    !enabled;

}


// ======================================================
// RESET POSITION
// ======================================================

function resetPosition() {

  state.zoom = 1;

  state.x = 0;

  state.y = 0;


  zoomRange.value = "1";

  zoomValue.value =
    "100%";


  draw();

}


// ======================================================
// LOAD PHOTO
// ======================================================

function loadPhotoFile(file) {

  if (!file) {
    return;
  }


  if (
    !file.type.startsWith("image/")
  ) {

    alert(
      "File harus berupa gambar."
    );

    return;

  }


  // remove old blob url
  if (photoUrl) {

    URL.revokeObjectURL(
      photoUrl
    );

  }


  photoUrl =
    URL.createObjectURL(file);


  const img =
    new Image();


  img.onload = () => {

    photo = img;


    emptyState.hidden =
      true;


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


// ======================================================
// OVERLAY LOAD
// ======================================================

overlay.addEventListener(
  "load",
  draw
);


// ======================================================
// FILE INPUT
// ======================================================

photoInput.addEventListener(
  "change",
  (event) => {

    const file =
      event.target.files?.[0];


    loadPhotoFile(
      file
    );

  }
);


// ======================================================
// ZOOM SLIDER
// ======================================================

zoomRange.addEventListener(
  "input",
  () => {

    state.zoom =
      Number(
        zoomRange.value
      );


    zoomValue.value =
      `${Math.round(
        state.zoom * 100
      )}%`;


    draw();

  }
);


// ======================================================
// RESET BUTTON
// ======================================================

resetBtn.addEventListener(
  "click",
  resetPosition
);


// ======================================================
// POINTER POSITION
// ======================================================

function pointerToCanvas(event) {

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


// ======================================================
// POINTER DISTANCE
// ======================================================

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


// ======================================================
// SYNC ZOOM UI
// ======================================================

function syncZoomUI() {

  state.zoom =
    clamp(
      state.zoom,
      1,
      3
    );


  zoomRange.value =
    String(
      state.zoom
    );


  zoomValue.value =
    `${Math.round(
      state.zoom * 100
    )}%`;

}


// ======================================================
// MOUSE WHEEL ZOOM
// ======================================================

canvas.addEventListener(
  "wheel",
  (event) => {

    if (!photo) {
      return;
    }


    event.preventDefault();


    const direction =
      event.deltaY > 0
        ? -0.08
        : 0.08;


    state.zoom +=
      direction;


    syncZoomUI();

    draw();

  },
  {
    passive: false
  }
);


// ======================================================
// POINTER DOWN
// ======================================================

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


// ======================================================
// POINTER MOVE
// ======================================================

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


    // DRAG
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
      drag.originX
      +
      (
        point.x -
        drag.startX
      );


    state.y =
      drag.originY
      +
      (
        point.y -
        drag.startY
      );


    draw();

  }
);


// ======================================================
// POINTER END
// ======================================================

function finishPointer(event) {

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


// ======================================================
// DRAG AND DROP FILE
// ======================================================

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
      event.dataTransfer
        ?.files?.[0];


    loadPhotoFile(
      file
    );

  }
);


// ======================================================
// DOWNLOAD PNG
// ======================================================

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


// ======================================================
// CAPTION AUTO GENERATOR
// ======================================================

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


// ======================================================
// COPY CAPTION
// ======================================================

copyCaptionBtn.addEventListener(
  "click",
  async () => {

    const text =
      captionText.value.trim();


    try {

      await navigator.clipboard.writeText(
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


// ======================================================
// CLEANUP BLOB
// ======================================================

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


// ======================================================
// INITIAL STATE
// ======================================================

setEditorEnabled(
  false
);

draw();

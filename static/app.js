const DRESS_TEMPLATES = {
  ballgown: {
    title: "Fairy-Tale Ball Gown",
    defaultName: "Royal Bloom",
    baseColor: "#fde7f3",
    mask: drawBallgownMask,
    outline: drawBallgownOutline
  },
  aodai: {
    title: "Vietnamese-Inspired Áo Dài",
    defaultName: "Lotus Grace",
    baseColor: "#ffeaf2",
    mask: drawAoDaiMask,
    outline: drawAoDaiOutline
  },
  runway: {
    title: "Runway Gown",
    defaultName: "Midnight Spotlight",
    baseColor: "#efe6ff",
    mask: drawRunwayMask,
    outline: drawRunwayOutline
  }
};

const dressCanvas = document.getElementById("dressCanvas");

if (dressCanvas) {
  const ctx = dressCanvas.getContext("2d");
  const paintLayer = document.createElement("canvas");
  const maskLayer = document.createElement("canvas");
  paintLayer.width = dressCanvas.width;
  paintLayer.height = dressCanvas.height;
  maskLayer.width = dressCanvas.width;
  maskLayer.height = dressCanvas.height;
  const paintCtx = paintLayer.getContext("2d");
  const maskCtx = maskLayer.getContext("2d");

  const dressSelect = document.getElementById("dressSelect");
  const lookName = document.getElementById("lookName");
  const colorPicker = document.getElementById("colorPicker");
  const brushSize = document.getElementById("brushSize");
  const brushSizeValue = document.getElementById("brushSizeValue");
  const dressTitle = document.getElementById("dressTitle");
  const status = document.getElementById("status");

  const toolPaintBtn = document.getElementById("toolPaintBtn");
  const toolGlitterBtn = document.getElementById("toolGlitterBtn");
  const toolEraseBtn = document.getElementById("toolEraseBtn");
  const clearBtn = document.getElementById("clearBtn");
  const saveBtn = document.getElementById("saveBtn");

  let currentDressKey = "ballgown";
  let currentTool = "paint";
  let isDrawing = false;
  let lastPoint = null;

  function rebuildMask() {
    maskCtx.clearRect(0, 0, maskLayer.width, maskLayer.height);
    maskCtx.fillStyle = "#000";
    DRESS_TEMPLATES[currentDressKey].mask(maskCtx);
    maskCtx.fill();
  }

  function fillBaseDress() {
    paintCtx.clearRect(0, 0, paintLayer.width, paintLayer.height);
    paintCtx.fillStyle = DRESS_TEMPLATES[currentDressKey].baseColor;
    DRESS_TEMPLATES[currentDressKey].mask(paintCtx);
    paintCtx.fill();
  }

  function drawDesigner() {
    ctx.clearRect(0, 0, dressCanvas.width, dressCanvas.height);
    drawStudioBackground(ctx, dressCanvas.width, dressCanvas.height);

    ctx.save();
    ctx.drawImage(maskLayer, 0, 0);
    ctx.globalCompositeOperation = "source-in";
    ctx.drawImage(paintLayer, 0, 0);
    ctx.restore();

    DRESS_TEMPLATES[currentDressKey].outline(ctx);

    ctx.fillStyle = "#6b5c80";
    ctx.font = "16px Arial";
    ctx.fillText("Paint stays clipped inside the silhouette.", 24, 34);
  }

  function setTool(toolName) {
    currentTool = toolName;
    [toolPaintBtn, toolGlitterBtn, toolEraseBtn].forEach(btn => btn.classList.remove("active"));
    if (toolName === "paint") toolPaintBtn.classList.add("active");
    if (toolName === "glitter") toolGlitterBtn.classList.add("active");
    if (toolName === "erase") toolEraseBtn.classList.add("active");
  }

  function applyMasked(fn) {
    paintCtx.save();
    fn(paintCtx);
    paintCtx.globalCompositeOperation = "destination-in";
    paintCtx.drawImage(maskLayer, 0, 0);
    paintCtx.restore();
  }

  function getPoint(evt) {
    const rect = dressCanvas.getBoundingClientRect();
    const sx = dressCanvas.width / rect.width;
    const sy = dressCanvas.height / rect.height;
    return {
      x: (evt.clientX - rect.left) * sx,
      y: (evt.clientY - rect.top) * sy
    };
  }

  function drawLine(a, b) {
    const size = Number(brushSize.value);
    const color = colorPicker.value;
    applyMasked((pctx) => {
      pctx.lineCap = "round";
      pctx.lineJoin = "round";
      pctx.lineWidth = size;
      if (currentTool === "erase") {
        pctx.globalCompositeOperation = "destination-out";
        pctx.strokeStyle = "rgba(0,0,0,1)";
      } else {
        pctx.strokeStyle = color;
      }
      pctx.beginPath();
      pctx.moveTo(a.x, a.y);
      pctx.lineTo(b.x, b.y);
      pctx.stroke();
    });
  }

  function drawGlitter(point) {
    const size = Number(brushSize.value);
    const color = colorPicker.value;
    applyMasked((pctx) => {
      for (let i = 0; i < 16; i += 1) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * size * 0.9;
        const x = point.x + Math.cos(angle) * radius;
        const y = point.y + Math.sin(angle) * radius;
        const sparkle = 2 + Math.random() * 4;
        pctx.fillStyle = i % 3 === 0 ? "#ffffff" : color;
        pctx.beginPath();
        pctx.arc(x, y, sparkle, 0, Math.PI * 2);
        pctx.fill();
      }
    });
  }

  function pointerDown(evt) {
    isDrawing = true;
    const point = getPoint(evt);
    lastPoint = point;
    if (currentTool === "glitter") {
      drawGlitter(point);
    } else {
      drawLine(point, point);
    }
    drawDesigner();
  }

  function pointerMove(evt) {
    if (!isDrawing) return;
    const point = getPoint(evt);
    if (currentTool === "glitter") {
      drawGlitter(point);
    } else {
      drawLine(lastPoint, point);
      lastPoint = point;
    }
    drawDesigner();
  }

  function pointerUp() {
    isDrawing = false;
    lastPoint = null;
  }

  function selectDress(key) {
    currentDressKey = key;
    const template = DRESS_TEMPLATES[key];
    dressTitle.textContent = template.title;
    lookName.value = template.defaultName;
    rebuildMask();
    fillBaseDress();
    drawDesigner();
  }

  function exportDressOnly() {
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = dressCanvas.width;
    exportCanvas.height = dressCanvas.height;
    const ex = exportCanvas.getContext("2d");
    ex.drawImage(maskLayer, 0, 0);
    ex.globalCompositeOperation = "source-in";
    ex.drawImage(paintLayer, 0, 0);
    return exportCanvas.toDataURL("image/png");
  }

  async function sendToRunway() {
    const payload = {
      dressType: currentDressKey,
      label: (lookName.value || DRESS_TEMPLATES[currentDressKey].defaultName).trim(),
      design: exportDressOnly()
    };
    const response = await fetch("/save-design", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(payload)
    });
    status.textContent = response.ok ? `Sent "${payload.label}" to the runway!` : "Could not send the design.";
  }

  toolPaintBtn.addEventListener("click", () => setTool("paint"));
  toolGlitterBtn.addEventListener("click", () => setTool("glitter"));
  toolEraseBtn.addEventListener("click", () => setTool("erase"));
  clearBtn.addEventListener("click", () => {
    fillBaseDress();
    drawDesigner();
    status.textContent = "Dress cleared.";
  });
  saveBtn.addEventListener("click", sendToRunway);
  dressSelect.addEventListener("change", (e) => selectDress(e.target.value));
  brushSize.addEventListener("input", () => brushSizeValue.textContent = brushSize.value);

  dressCanvas.addEventListener("pointerdown", pointerDown);
  dressCanvas.addEventListener("pointermove", pointerMove);
  window.addEventListener("pointerup", pointerUp);

  brushSizeValue.textContent = brushSize.value;
  selectDress(currentDressKey);
  setTool("paint");
}

const worldCanvas = document.getElementById("worldCanvas");

if (worldCanvas) {
  const ctx = worldCanvas.getContext("2d");
  let walkers = [];
  let tick = 0;

  function spawnWalker(payload) {
    const img = new Image();
    img.src = payload.design;
    walkers.push({
      x: -220 - Math.random() * 120,
      y: 170 + Math.random() * 90,
      speed: 1.6 + Math.random() * 1.0,
      img,
      dressType: payload.dressType || "ballgown",
      label: payload.label || "Custom Look",
      bob: Math.random() * Math.PI * 2
    });
  }

  function drawWorldBackground() {
    const w = worldCanvas.width;
    const h = worldCanvas.height;
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, "#efdfff");
    sky.addColorStop(0.55, "#ffeef9");
    sky.addColorStop(1, "#ffd8ea");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = "#6b2db7";
    ctx.fillRect(0, 0, 90, h);
    ctx.fillRect(w - 90, 0, 90, h);

    ctx.fillStyle = "#8b46db";
    for (let i = 0; i < 90; i += 18) {
      ctx.fillRect(i, 0, 9, h);
      ctx.fillRect(w - 90 + i, 0, 9, h);
    }

    for (let i = 0; i < 6; i += 1) {
      const x = 160 + i * 210;
      ctx.fillStyle = "rgba(255,255,210,0.18)";
      ctx.beginPath();
      ctx.moveTo(x - 35, 70);
      ctx.lineTo(x + 35, 70);
      ctx.lineTo(x + 145, 640);
      ctx.lineTo(x - 145, 640);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#fff6c5";
      ctx.beginPath();
      ctx.arc(x, 70, 18, 0, Math.PI * 2);
      ctx.fill();
    }

    const runway = ctx.createLinearGradient(0, 520, 0, 820);
    runway.addColorStop(0, "#ffe9f4");
    runway.addColorStop(1, "#d0a0ff");
    ctx.fillStyle = runway;
    ctx.beginPath();
    ctx.moveTo(330, 280);
    ctx.lineTo(1070, 280);
    ctx.lineTo(1320, 820);
    ctx.lineTo(80, 820);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "rgba(255,255,255,0.8)";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(330, 280);
    ctx.lineTo(80, 820);
    ctx.moveTo(1070, 280);
    ctx.lineTo(1320, 820);
    ctx.stroke();

    for (let i = 0; i < 22; i += 1) {
      const x = 40 + i * 62;
      const y = 706 + Math.sin((i + tick * 0.03) * 0.7) * 8;
      ctx.fillStyle = i % 2 === 0 ? "#4e296e" : "#6e3a8b";
      ctx.beginPath();
      ctx.arc(x, y, 18, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function getDressProfile(type) {
    if (type === "aodai") {
      return {
        imgX: 10, imgY: 28, imgW: 154, imgH: 330,
        legLeftX1: 72, legLeftY1: 344, legLeftX2: 66, legLeftY2: 394,
        legRightX1: 102, legRightY1: 344, legRightX2: 108, legRightY2: 394,
        overlay: (ctx, x, y) => {
          ctx.beginPath();
          ctx.moveTo(x + 88, y + 126);
          ctx.lineTo(x + 88, y + 320);
          ctx.stroke();
        }
      };
    }
    if (type === "runway") {
      return {
        imgX: 8, imgY: 22, imgW: 162, imgH: 344,
        legLeftX1: 78, legLeftY1: 338, legLeftX2: 72, legLeftY2: 398,
        legRightX1: 112, legRightY1: 338, legRightX2: 118, legRightY2: 398,
        overlay: (ctx, x, y) => {
          ctx.beginPath();
          ctx.moveTo(x + 56, y + 220);
          ctx.quadraticCurveTo(x + 118, y + 206, x + 140, y + 300);
          ctx.stroke();
        }
      };
    }
    return {
      imgX: 4, imgY: 22, imgW: 168, imgH: 340,
      legLeftX1: 72, legLeftY1: 332, legLeftX2: 66, legLeftY2: 390,
      legRightX1: 104, legRightY1: 332, legRightX2: 110, legRightY2: 390,
      overlay: (ctx, x, y) => {
        ctx.beginPath();
        ctx.moveTo(x + 40, y + 230);
        ctx.quadraticCurveTo(x + 88, y + 254, x + 136, y + 230);
        ctx.stroke();
      }
    };
  }

  function drawWalker(walker) {
    const bob = Math.sin(tick * 0.05 + walker.bob) * 3;
    const x = walker.x;
    const y = walker.y + bob;

    ctx.fillStyle = "rgba(60,20,80,0.18)";
    ctx.beginPath();
    ctx.ellipse(x + 88, y + 348, 74, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#f2c7a9";
    ctx.beginPath();
    ctx.arc(x + 88, y + 62, 28, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#4f2f2f";
    ctx.beginPath();
    ctx.arc(x + 88, y + 50, 32, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(x + 56, y + 50, 64, 24);

    ctx.fillStyle = "#f5c85b";
    ctx.beginPath();
    ctx.moveTo(x + 68, y + 28);
    ctx.lineTo(x + 78, y + 12);
    ctx.lineTo(x + 88, y + 22);
    ctx.lineTo(x + 98, y + 10);
    ctx.lineTo(x + 108, y + 28);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#f2c7a9";
    ctx.fillRect(x + 82, y + 90, 12, 18);

    const profile = getDressProfile(walker.dressType);
    if (walker.img.complete) {
      ctx.drawImage(walker.img, x + profile.imgX, y + profile.imgY, profile.imgW, profile.imgH);
    }

    ctx.strokeStyle = "#f2c7a9";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(x + 56, y + 132);
    ctx.lineTo(x + 34, y + 214);
    ctx.moveTo(x + 118, y + 132);
    ctx.lineTo(x + 140, y + 214);
    ctx.stroke();

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    profile.overlay(ctx, x, y);

    ctx.strokeStyle = "#f2c7a9";
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(x + profile.legLeftX1, y + profile.legLeftY1);
    ctx.lineTo(x + profile.legLeftX2, y + profile.legLeftY2);
    ctx.moveTo(x + profile.legRightX1, y + profile.legRightY1);
    ctx.lineTo(x + profile.legRightX2, y + profile.legRightY2);
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    roundRect(ctx, x - 6, y - 14, 176, 34, 17, true, false);
    ctx.fillStyle = "#6b2db7";
    ctx.font = "bold 18px Arial";
    ctx.fillText(walker.label, x + 14, y + 8);
  }

  function animate() {
    tick += 1;
    drawWorldBackground();
    for (const walker of walkers) {
      drawWalker(walker);
      walker.x += walker.speed;
    }
    walkers = walkers.filter(w => w.x < worldCanvas.width + 240);
    requestAnimationFrame(animate);
  }

  animate();

  const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const wsUrl = `${wsProtocol}//${window.location.host}/ws/world`;
  console.log("Connecting websocket to:", wsUrl);
  const ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    console.log("WebSocket connected");
    ws.send("world-connected");
  };

  ws.onclose = (event) => {
    console.log("WebSocket closed", event);
  };

  ws.onerror = (event) => {
    console.log("WebSocket error", event);
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === "new_design") {
      spawnWalker(data);
    }
  };
}

function drawStudioBackground(ctx, width, height) {
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, "#fff8fc");
  grad.addColorStop(1, "#f2ebff");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "#fbf3ff";
  ctx.fillRect(22, 22, width - 44, height - 44);

  ctx.fillStyle = "#eadbff";
  ctx.fillRect(50, 80, 28, 700);
  ctx.fillRect(width - 78, 80, 28, 700);

  for (let i = 0; i < 24; i += 1) {
    const x = 100 + (i % 6) * 100 + ((i * 37) % 30);
    const y = 80 + Math.floor(i / 6) * 70;
    drawSparkle(ctx, x, y, 7, "#f5c85b");
  }

  ctx.strokeStyle = "#dccdf7";
  ctx.lineWidth = 4;
  roundRect(ctx, 22, 22, width - 44, height - 44, 24, false, true);
}

function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

function drawSparkle(ctx, x, y, size, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - size, y);
  ctx.lineTo(x + size, y);
  ctx.moveTo(x, y - size);
  ctx.lineTo(x, y + size);
  ctx.moveTo(x - size * 0.6, y - size * 0.6);
  ctx.lineTo(x + size * 0.6, y + size * 0.6);
  ctx.moveTo(x + size * 0.6, y - size * 0.6);
  ctx.lineTo(x - size * 0.6, y + size * 0.6);
  ctx.stroke();
  ctx.restore();
}

function drawBallgownMask(ctx) {
  ctx.beginPath();
  ctx.moveTo(295, 185);
  ctx.quadraticCurveTo(360, 145, 425, 185);
  ctx.lineTo(470, 280);
  ctx.quadraticCurveTo(530, 430, 590, 700);
  ctx.lineTo(130, 700);
  ctx.quadraticCurveTo(190, 430, 250, 280);
  ctx.closePath();
}

function drawBallgownOutline(ctx) {
  ctx.fillStyle = "#f2c7a9";
  ctx.beginPath();
  ctx.arc(360, 102, 42, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#5a356b";
  ctx.beginPath();
  ctx.moveTo(312, 160);
  ctx.quadraticCurveTo(360, 118, 408, 160);
  ctx.lineTo(400, 230);
  ctx.lineTo(320, 230);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "#f2c7a9";
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.moveTo(320, 184);
  ctx.lineTo(232, 266);
  ctx.moveTo(400, 184);
  ctx.lineTo(488, 266);
  ctx.stroke();

  ctx.strokeStyle = "#7d5db0";
  ctx.lineWidth = 6;
  drawBallgownMask(ctx);
  ctx.stroke();

  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(280, 250);
  ctx.quadraticCurveTo(360, 290, 440, 250);
  ctx.stroke();

  ctx.fillStyle = "#f5c85b";
  ctx.fillRect(290, 230, 140, 16);
  drawSparkle(ctx, 200, 650, 10, "#f5c85b");
  drawSparkle(ctx, 520, 650, 10, "#f5c85b");
}

function drawAoDaiMask(ctx) {
  ctx.beginPath();
  ctx.moveTo(305, 178);
  ctx.quadraticCurveTo(360, 150, 415, 178);
  ctx.lineTo(442, 602);
  ctx.lineTo(382, 602);
  ctx.lineTo(372, 735);
  ctx.lineTo(348, 735);
  ctx.lineTo(338, 602);
  ctx.lineTo(278, 602);
  ctx.closePath();
  ctx.moveTo(338, 310);
  ctx.lineTo(240, 720);
  ctx.lineTo(300, 720);
  ctx.lineTo(352, 430);
  ctx.closePath();
  ctx.moveTo(382, 310);
  ctx.lineTo(420, 430);
  ctx.lineTo(470, 720);
  ctx.lineTo(530, 720);
  ctx.closePath();
}

function drawAoDaiOutline(ctx) {
  ctx.fillStyle = "#f2c7a9";
  ctx.beginPath();
  ctx.arc(360, 98, 42, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#f5c85b";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(360, 98, 58, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "#5a356b";
  ctx.fillRect(332, 140, 56, 54);

  ctx.strokeStyle = "#f2c7a9";
  ctx.lineWidth = 11;
  ctx.beginPath();
  ctx.moveTo(314, 200);
  ctx.lineTo(228, 312);
  ctx.moveTo(406, 200);
  ctx.lineTo(492, 312);
  ctx.stroke();

  ctx.strokeStyle = "#7d5db0";
  ctx.lineWidth = 6;
  drawAoDaiMask(ctx);
  ctx.stroke();

  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(360, 190);
  ctx.lineTo(360, 590);
  ctx.stroke();

  for (let i = 0; i < 5; i += 1) {
    ctx.fillStyle = i % 2 === 0 ? "#f5c85b" : "#ffffff";
    ctx.beginPath();
    ctx.arc(360, 240 + i * 54, 8, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawRunwayMask(ctx) {
  ctx.beginPath();
  ctx.moveTo(330, 178);
  ctx.quadraticCurveTo(360, 146, 390, 178);
  ctx.lineTo(430, 314);
  ctx.lineTo(472, 760);
  ctx.lineTo(408, 760);
  ctx.lineTo(380, 390);
  ctx.lineTo(340, 390);
  ctx.lineTo(312, 760);
  ctx.lineTo(248, 760);
  ctx.lineTo(290, 314);
  ctx.closePath();
  ctx.moveTo(430, 330);
  ctx.quadraticCurveTo(560, 420, 610, 720);
  ctx.lineTo(505, 720);
  ctx.quadraticCurveTo(468, 540, 390, 410);
  ctx.closePath();
}

function drawRunwayOutline(ctx) {
  ctx.fillStyle = "#f2c7a9";
  ctx.beginPath();
  ctx.arc(360, 98, 42, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#242033";
  ctx.beginPath();
  ctx.arc(360, 88, 46, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(318, 88, 84, 24);

  ctx.fillStyle = "#5a356b";
  ctx.beginPath();
  ctx.moveTo(334, 145);
  ctx.lineTo(386, 145);
  ctx.lineTo(396, 230);
  ctx.lineTo(324, 230);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "#f5c85b";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(340, 146);
  ctx.lineTo(322, 114);
  ctx.stroke();

  ctx.strokeStyle = "#f2c7a9";
  ctx.lineWidth = 11;
  ctx.beginPath();
  ctx.moveTo(326, 186);
  ctx.lineTo(236, 240);
  ctx.moveTo(396, 186);
  ctx.lineTo(466, 266);
  ctx.stroke();

  ctx.strokeStyle = "#7d5db0";
  ctx.lineWidth = 6;
  drawRunwayMask(ctx);
  ctx.stroke();

  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(300, 265);
  ctx.quadraticCurveTo(360, 300, 420, 265);
  ctx.stroke();

  drawSparkle(ctx, 465, 458, 10, "#f5c85b");
  drawSparkle(ctx, 540, 630, 12, "#ffffff");
}

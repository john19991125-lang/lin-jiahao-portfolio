const content = window.PORTFOLIO_CONTENT;
const $ = (selector) => document.querySelector(selector);
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
document.documentElement.classList.add("motion-ready");

$("#brand-name").textContent = content.name;
$("#hero-name").textContent = content.name;
$("#hero-role").textContent = content.role;
$("#footer-name").textContent = content.name;
$("#hero-intro").textContent = content.intro;
$("#about-education").textContent = content.education;
for (const specialty of content.specialties) {
  const item = document.createElement("li");
  item.textContent = specialty;
  $("#about-specialties").append(item);
}
if (content.email) {
  $("#hero-email").href = `mailto:${content.email}`;
  $("#hero-email-value").textContent = content.email;
}
if (content.phone) {
  const href = `tel:${content.phone.replace(/[^+\d]/g, "")}`;
  $("#hero-phone").href = href;
  $("#hero-phone-value").textContent = content.phone;
}

const heroFrame = $(".hero-art-frame");
if (content.showreelUrl) {
  const video = document.createElement("video");
  video.className = "hero-media";
  video.src = content.showreelUrl;
  video.poster = content.portraitUrl || "";
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.autoplay = !reducedMotion.matches;
  video.controls = reducedMotion.matches;
  video.preload = "metadata";
  heroFrame.prepend(video);
  heroFrame.classList.add("has-media");
} else if (content.portraitUrl) {
  const image = document.createElement("img");
  image.className = "hero-media";
  image.src = content.portraitUrl;
  image.alt = `${content.name} 的個人形象照`;
  heroFrame.prepend(image);
  heroFrame.classList.add("has-media");
}
const photoGrid = $("#photo-grid");
const photoDialog = $("#photo-dialog");
const photoDialogImage = $("#photo-dialog-image");
let activeSeries = null;
let activePhotoIndex = 0;
let lastFocused = null;

for (const series of content.photoSeries) {
  series.images.forEach((imageUrl, photoIndex) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "photo-card reveal";
    card.dataset.type = series.type;
    card.dataset.seriesId = series.id;
    card.dataset.photoIndex = String(photoIndex + 1);
    card.setAttribute("aria-label", `放大${series.title}第 ${photoIndex + 1} 張照片`);
    card.innerHTML = '<span class="photo-card-visual"><img alt="" loading="lazy" decoding="async" /><span class="photo-card-count"></span></span><span class="photo-card-meta"><span><small class="photo-card-kind"></small><strong class="photo-card-title"></strong></span></span>';
    card.querySelector("img").src = imageUrl;
    card.querySelector(".photo-card-count").textContent = `${String(photoIndex + 1).padStart(2, "0")} / ${String(series.images.length).padStart(2, "0")}`;
    card.querySelector(".photo-card-kind").textContent = series.kind === "AI × 實拍" ? series.kind : series.type === "portrait" ? "人物" : "靜物";
    card.querySelector(".photo-card-title").textContent = series.title.replace(/^(人物|靜物)攝影 /, "系列 ").replace(/^AI 生成＋實拍/, "");
    card.addEventListener("click", () => openSeries(series, photoIndex));
    card.addEventListener("pointermove", (event) => {
      if (reducedMotion.matches || event.pointerType === "touch") return;
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--card-x", `${((event.clientX - rect.left) / rect.width) * 100}%`);
      card.style.setProperty("--card-y", `${((event.clientY - rect.top) / rect.height) * 100}%`);
    });
    photoGrid.append(card);
  });
}
$("#count-all").textContent = String(content.photoSeries.reduce((count, series) => count + series.images.length, 0)).padStart(2, "0");
for (const type of ["portrait", "still"]) {
  $("#count-" + type).textContent = String(content.photoSeries.filter((series) => series.type === type).reduce((count, series) => count + series.images.length, 0)).padStart(2, "0");
}
function showPhoto() {
  if (!activeSeries) return;
  const count = activeSeries.images.length;
  photoDialogImage.src = activeSeries.images[activePhotoIndex];
  photoDialogImage.alt = `${activeSeries.title}，第 ${activePhotoIndex + 1} 張，共 ${count} 張`;
  $("#photo-position").textContent = `${String(activePhotoIndex + 1).padStart(2, "0")} / ${String(count).padStart(2, "0")}`;
  $("#photo-prev").disabled = count === 1;
  $("#photo-next").disabled = count === 1;
}
function openSeries(series, photoIndex = 0) {
  lastFocused = document.activeElement;
  activeSeries = series;
  activePhotoIndex = photoIndex;
  $("#photo-dialog-kind").textContent = series.kind;
  $("#photo-dialog-title").textContent = series.title;
  showPhoto();
  photoDialog.showModal();
  $("#photo-close").focus();
}
function movePhoto(direction) {
  if (!activeSeries || activeSeries.images.length < 2) return;
  activePhotoIndex = (activePhotoIndex + direction + activeSeries.images.length) % activeSeries.images.length;
  showPhoto();
}
$("#photo-prev").addEventListener("click", () => movePhoto(-1));
$("#photo-next").addEventListener("click", () => movePhoto(1));
$("#photo-close").addEventListener("click", () => photoDialog.close());
photoDialog.addEventListener("click", (event) => { if (event.target === photoDialog) photoDialog.close(); });
photoDialog.addEventListener("close", () => { photoDialogImage.removeAttribute("src"); lastFocused?.focus(); });
photoDialog.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") { event.preventDefault(); movePhoto(-1); }
  if (event.key === "ArrowRight") { event.preventDefault(); movePhoto(1); }
});

for (const [index, experience] of content.experience.entries()) {
  const row = document.createElement("div");
  row.className = "experience-row reveal";
  row.innerHTML = `<span class="experience-no">${String(index + 1).padStart(2, "0")}</span><span class="experience-year"></span><div><strong class="experience-role"></strong><span class="experience-org"></span></div><p class="experience-note"></p>`;
  row.querySelector(".experience-year").textContent = experience.years;
  row.querySelector(".experience-role").textContent = experience.role;
  row.querySelector(".experience-org").textContent = experience.organization;
  row.querySelector(".experience-note").textContent = experience.note;
  $("#experience-list").append(row);
}

const videoDialog = $("#video-dialog");
const videoPlayer = $("#video-player");
let videoLastFocused = null;
$("#ad-count").textContent = String(content.videos.ad.length).padStart(2, "0");
$("#mv-count").textContent = String(content.videos.mv.length).padStart(2, "0");
$("#short-count").textContent = String(content.videos.short.length).padStart(2, "0");
function renderVideoCard(video, index, videos, kind, target) {
  const card = document.createElement("button");
  card.type = "button";
  card.className = `ad-card reveal ${video.orientation === "portrait" ? "is-tall" : "is-wide"}`;
  const categoryName = kind === "mv" ? "MV" : kind === "short" ? "短片" : "廣告短片";
  card.setAttribute("aria-label", `播放${video.title}${categoryName}`);
  card.innerHTML = '<span class="ad-card-poster"><img alt="" loading="lazy" decoding="async" /><span class="ad-play" aria-hidden="true">▶</span></span><span class="ad-card-meta"><strong></strong><small></small></span>';
  card.querySelector("img").src = video.poster;
  card.querySelector("strong").textContent = video.title;
  card.querySelector("small").textContent = `${String(index + 1).padStart(2, "0")} / ${String(videos.length).padStart(2, "0")}`;
  card.addEventListener("click", () => {
    videoLastFocused = document.activeElement;
    $("#video-dialog-kind").textContent = kind === "mv" ? "MUSIC VIDEO" : kind === "short" ? "SHORT FILM" : "AD FILM";
    $("#video-dialog-title").textContent = card.querySelector(".ad-card-meta strong").textContent.trim();
    videoDialog.classList.toggle("is-tall", video.orientation === "portrait");
    videoPlayer.poster = video.poster;
    videoPlayer.src = video.src;
    videoDialog.showModal();
    videoPlayer.play().catch(() => {});
  });
  $(target).append(card);
}
content.videos.ad.forEach((video, index, videos) => renderVideoCard(video, index, videos, "ad", video.orientation === "portrait" ? "#ad-grid-tall" : "#ad-grid-wide"));
content.videos.mv.forEach((video, index, videos) => renderVideoCard(video, index, videos, "mv", "#mv-grid"));
content.videos.short.forEach((video, index, videos) => renderVideoCard(video, index, videos, "short", video.orientation === "portrait" ? "#short-grid-tall" : "#short-grid-wide"));
$("#video-close").addEventListener("click", () => videoDialog.close());
videoDialog.addEventListener("click", (event) => { if (event.target === videoDialog) videoDialog.close(); });
videoDialog.addEventListener("close", () => {
  videoPlayer.pause();
  videoPlayer.removeAttribute("src");
  videoPlayer.load();
  videoLastFocused?.focus();
});

document.querySelectorAll(".filter").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".filter").forEach((item) => {
      const active = item === button;
      item.classList.toggle("is-active", active);
      item.setAttribute("aria-pressed", String(active));
    });
    photoGrid.querySelectorAll(".photo-card").forEach((card) => {
      card.hidden = button.dataset.filter !== "all" && card.dataset.type !== button.dataset.filter;
    });
  });
});
document.querySelector('[data-category="photo"]').addEventListener("click", () => {
  document.querySelector('.filter[data-filter="all"]').click();
});

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) if (entry.isIntersecting) { entry.target.classList.add("is-visible"); observer.unobserve(entry.target); }
  }, { threshold: 0.08, rootMargin: "0px 0px -20px 0px" });
  document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));
} else {
  document.querySelectorAll(".reveal").forEach((element) => element.classList.add("is-visible"));
}

const progressBar = $("#scroll-progress-bar");
let scrollQueued = false;
function updateScrollMotion() {
  const available = document.documentElement.scrollHeight - window.innerHeight;
  const progress = available > 0 ? window.scrollY / available : 0;
  progressBar.style.transform = `scaleX(${Math.max(0, Math.min(1, progress))})`;
  if (!reducedMotion.matches) heroFrame.style.setProperty("--scroll-shift", `${Math.min(window.scrollY * 0.12, 65)}px`);
  scrollQueued = false;
}
window.addEventListener("scroll", () => {
  if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(updateScrollMotion); }
}, { passive: true });
window.addEventListener("resize", updateScrollMotion);
updateScrollMotion();
if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
  heroFrame.addEventListener("pointermove", (event) => {
    if (reducedMotion.matches) return;
    const rect = heroFrame.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    heroFrame.style.setProperty("--pointer-x", `${x * 18}px`);
    heroFrame.style.setProperty("--pointer-y", `${y * 18}px`);
    heroFrame.style.setProperty("--light-x", `${(x + 0.5) * 100}%`);
    heroFrame.style.setProperty("--light-y", `${(y + 0.5) * 100}%`);
  });
  heroFrame.addEventListener("pointerleave", () => {
    heroFrame.style.setProperty("--pointer-x", "0px");
    heroFrame.style.setProperty("--pointer-y", "0px");
  });
}

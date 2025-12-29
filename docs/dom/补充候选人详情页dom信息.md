## 测试1，控制台发送：

// 在浏览器控制台执行，获取关键元素的详细信息
const dialog = document.querySelector('[class*="dialog-lib-resume"]');
const layoutWrap = dialog?.querySelector('.resume-layout-wrap');
const iframe = dialog?.querySelector('iframe[src*="c-resume"]');

// 获取左侧内容区域的准确选择器
console.log('Dialog:', dialog);
console.log('LayoutWrap:', layoutWrap);
console.log('LayoutWrap children:', layoutWrap?.children);
console.log('Left content area:', layoutWrap?.querySelector('.resume-left-side'));
console.log('Iframe:', iframe);
console.log('Iframe rect:', iframe?.getBoundingClientRect());

---

## 控制台返回1

Dialog: <div class=​"boss-popup__wrapper boss-dialog boss-dialog__wrapper dialog-lib-resume recommendV2" style=​"animation-duration:​ 0s;​ z-index:​ 2008;​">​…​</div>​

VM6873:8 LayoutWrap: <div data-v-c8a25a40 class=​"resume-layout-wrap">​…​</div>​flex
VM6873:9 LayoutWrap children: HTMLCollection [div.resume-middle-wrap]
VM6873:10 Left content area: null
VM6873:11 Iframe: <iframe data-v-67076dda data-v-c8a25a40 src=​"/​web/​frame/​c-resume/​?source=recommend" frameborder=​"0" style=​"height:​ 4688px;​">​…​</iframe>​
VM6873:12 Iframe rect: DOMRect {x: 0, y: 0, width: 537, height: 4688, top: 0, …}

---

## 测试2 Canvas实际位置：

// 在iframe内部执行（如果可以访问）
const canvas = document.querySelector('#resume');
console.log('Canvas rect:', canvas?.getBoundingClientRect());
console.log('Canvas style:', window.getComputedStyle(canvas));
console.log('Canvas transform:', window.getComputedStyle(canvas).transform);
console.log('Canvas width/height:', canvas?.width, canvas?.height);
console.log('Canvas scrollHeight:', canvas?.parentElement?.scrollHeight);


## 测试2，控制台返回：

VM8677:4 Uncaught TypeError: Failed to execute 'getComputedStyle' on 'Window': parameter 1 is not of type 'Element'.
    at <anonymous>:4:37

## 测试4：
// 在控制台执行，提供这些rect信息
const elements = {
  dialog: dialog?.getBoundingClientRect(),
  layoutWrap: layoutWrap?.getBoundingClientRect(),
  leftContentArea: layoutWrap?.querySelector('.resume-left-side')?.getBoundingClientRect(),
  iframe: iframe?.getBoundingClientRect(),
  // 如果有其他关键元素也加上
};

console.log('Elements rect:', JSON.stringify(elements, null, 2));

## 返回4：
Elements rect: {
  "dialog": {
    "x": 0,
    "y": 0,
    "width": 891,
    "height": 817,
    "top": 0,
    "right": 891,
    "bottom": 817,
    "left": 0
  },
  "layoutWrap": {
    "x": 0,
    "y": 0,
    "width": 891,
    "height": 817,
    "top": 0,
    "right": 891,
    "bottom": 817,
    "left": 0
  },
  "iframe": {
    "x": 0,
    "y": 0,
    "width": 537,
    "height": 4688,
    "top": 0,
    "right": 537,
    "bottom": 4688,
    "left": 0
  }
}

## 测试5
console.log('Viewport:', {
  innerWidth: window.innerWidth,
  innerHeight: window.innerHeight,
  devicePixelRatio: window.devicePixelRatio,
  visualViewport: window.visualViewport ? {
    width: window.visualViewport.width,
    height: window.visualViewport.height,
    scale: window.visualViewport.scale
  } : null
});
## 返回5
Viewport: {innerWidth: 891, innerHeight: 817, devicePixelRatio: 2, visualViewport: {…}}

## 测试6
// 测试是否可以访问iframe内容
const iframe = document.querySelector('iframe[src*="c-resume"]');
try {
  const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
  console.log('可以访问iframe内容:', !!iframeDoc);
  if (iframeDoc) {
    const canvas = iframeDoc.querySelector('#resume');
    console.log('Canvas in iframe:', canvas?.getBoundingClientRect());
  }
} catch (e) {
  console.log('无法访问iframe（跨域）:', e.message);
}

## 返回6

VM8690:5 可以访问iframe内容: true
VM8690:8 Canvas in iframe: DOMRect {x: 0, y: 0, width: 537, height: 4688, top: 0, …}
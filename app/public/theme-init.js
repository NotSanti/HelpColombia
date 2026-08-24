(function () {
  try {
    var t = localStorage.getItem("hc-theme");
    document.documentElement.classList.toggle("dark", t !== "light");
  } catch (e) {
    document.documentElement.classList.add("dark");
  }
})();

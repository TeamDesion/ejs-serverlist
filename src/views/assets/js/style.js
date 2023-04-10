function imgError(place) {
  place.src =
    "https://cdn.discordapp.com/attachments/864965927820197898/867158091559600178/error.png";
}
function snackBar() {
  var x = document.getElementById("snackbar");
  x.className = "show";
  setTimeout(function() {
    x.className = x.className.replace("show", "");
  }, 3000);
}
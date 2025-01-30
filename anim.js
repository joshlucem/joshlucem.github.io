// Sincronizar las letras con la canción
var audio = document.querySelector("audio");
var lyrics = document.querySelector("#lyrics");

// Array de objetos que contiene cada línea y su tiempo de aparición en segundos
var lyricsData = [
  { text: "I've been watching you for some time", time: 13 },
  { text: "Can't stop staring at those ocean eyes", time: 19 },
  { text: "Burning cities and napalm skies", time: 25 },
  { text: "Fifteen flares inside those ocean eyes", time: 32 },
  { text: "Your ocean eyes", time: 38 },
  { text: "You really know how to make me cry", time: 48 },
  { text: "When you give me those ocean eyes", time: 51 },
  { text: "I'm scared", time: 58 },
  { text: "I've never fallen from quite this high", time: 62 },
  { text: "Falling into your ocean eyes", time: 65 },
  { text: "Those ocean eyes", time: 68 },
  { text: "I've been walking through a world gone blind", time: 72 },
  { text: "Can't stop thinking of your diamond mind", time: 78 },
  { text: "Careful creature made friends with time", time: 85 },
  { text: "He left her lonely with a diamond mind", time: 91 },
  { text: "And those ocean eyes", time: 94 },
  { text: "No fair", time: 101 },
  { text: "You really know how to make me cry", time: 107 },
  { text: "When you give me those ocean eyes", time: 110 },
  { text: "I'm scared", time: 115 },
  { text: "I've never fallen from quite this high", time: 120 },
  { text: "Falling into your ocean eyes", time: 125 },
  { text: "Those ocean eyes", time: 130 },
  { text: "You really know how to make me cry", time: 168 },
  { text: "When you give me those ocean eyes", time: 171 },
  { text: "I'm scared", time: 176 },
  { text: "I've never fallen from quite this high", time: 181 },
  { text: "Falling into your ocean eyes", time: 184 },
  { text: "Those ocean eyes", time: 188 }
];
// Animar las letras
function updateLyrics() {
  var time = Math.floor(audio.currentTime);
  var currentLine = lyricsData.find(
    (line) => time >= line.time && time < line.time + 6
  );

  if (currentLine) {
    // Calcula la opacidad basada en el tiempo en la línea actual
    var fadeInDuration = 0.1; // Duración del efecto de aparición en segundos
    var opacity = Math.min(1, (time - currentLine.time) / fadeInDuration);

    // Aplica el efecto de aparición
    lyrics.style.opacity = opacity;
    lyrics.innerHTML = currentLine.text;
  } else {
    // Restablece la opacidad y el contenido si no hay una línea actual
    lyrics.style.opacity = 0;
    lyrics.innerHTML = "";
  }
}

setInterval(updateLyrics, 1000);

//funcion titulo
// Función para ocultar el título después de 216 segundos
function ocultarTitulo() {
  var titulo = document.querySelector(".titulo");
  titulo.style.animation =
    "fadeOut 3s ease-in-out forwards"; /* Duración y función de temporización de la desaparición */
  setTimeout(function () {
    titulo.style.display = "none";
  }, 3000); // Espera 3 segundos antes de ocultar completamente
}

// Llama a la función después de 216 segundos (216,000 milisegundos)
setTimeout(ocultarTitulo, 216000);
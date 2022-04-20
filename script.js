const MAX_CHARS = 100
const MAX_ENCRYPTED = 232
$('button.encode, button.decode').click(function(event) {
  event.preventDefault();
});

function previewDecodeImage() {
  var file = document.querySelector('input[name=decodeFile]').files[0];

  previewImage(file, ".decode canvas", function() {
    $(".decode").fadeIn();
  });
}

function previewEncodeImage() {
  var file = document.querySelector("input[name=baseFile]").files[0];

  $(".images .message").hide();

  previewImage(file, ".original canvas", function() {
    $(".images .original").fadeIn();
    $(".images").fadeIn();
  });
}

function previewImage(file, canvasSelector, callback) {
  var reader = new FileReader();
  var image = new Image;
  var $canvas = $(canvasSelector);
  var context = $canvas[0].getContext('2d');

  if (file) {
    reader.readAsDataURL(file);
  }

  reader.onloadend = function () {
    image.src = URL.createObjectURL(file);

    image.onload = function() {
      $canvas.prop({
        'width': image.width,
        'height': image.height
      });

      context.drawImage(image, 0, 0);

      callback();
    }
  }
}

function encodeMessage() {
  $(".error").hide();

  var text = $("textarea.message").val().toString()+"|ö|";
  var passwd = $("textarea.password").val().toString();

  var $originalCanvas = $('.original canvas');
  var $messageCanvas = $('.message canvas');

  var originalContext = $originalCanvas[0].getContext("2d");
  var messageContext = $messageCanvas[0].getContext("2d");

  var width = $originalCanvas[0].width;
  var height = $originalCanvas[0].height;
  

  // Check if the image is big enough to hide the message
  if (text.length > MAX_CHARS) {
    $(".error")
      .text("Text zu lang max "+MAX_CHARS+" Zeichen.")
      .fadeIn();

    return;
  }

  // Pad with random bytes
  var pad_length = MAX_CHARS - text.length;
  text += randomBytes(pad_length)

  // encrypt message 
  encrypted = encrypt(text, passwd);
  //$(".error")
//	.text(text+"  ----"+encrypted.length+"|"+parseInt((width * height * 3) / 8)+"------  "+encrypted)
//	.fadeIn();

  $messageCanvas.prop({
    'width': width,
    'height': height
  });

  // Convert the message to a binary string
  var binaryMessage = "";
  for (i = 0; i < encrypted.length; i++) {
    var binaryChar = encrypted[i].charCodeAt(0).toString(2);

    // Pad with 0 until the binaryChar has a lenght of 8 (1 Byte)
    while(binaryChar.length < 8) {
      binaryChar = "0" + binaryChar;
    }

    binaryMessage += binaryChar;
  }

  // Apply the binary string to the image and draw it
  var message = originalContext.getImageData(0, 0, width, height);
  pixel = message.data;
  counter = 0;
  for (var i = 0, n = pixel.length; i < n; i += 4) {
    for (var offset =0; offset < 3; offset ++) {
      if (counter < binaryMessage.length) {
        if (pixel[i + offset] % 2 != parseInt(binaryMessage[counter])) {
          pixel[i + offset]--;
	}
        counter++;
      }
      else {
        break;
      }
    }
  }
  messageContext.putImageData(message, 0, 0);

  $(".images .message").fadeIn();
};

function decodeMessage() {
  var $originalCanvas = $('.decode canvas');
  var originalContext = $originalCanvas[0].getContext("2d");

  var original = originalContext.getImageData(0, 0, $originalCanvas.width(), $originalCanvas.height());
  var binaryMessage = "";
  var pixel = original.data;
  for (var i = 0, n = pixel.length; i < n; i += 4) {
    for (var offset =0; offset < 3; offset ++) {
      var value = 0;
      if(pixel[i + offset] %2 != 0) {
        value = 1;
      }

      binaryMessage += value;
    }
  }


  var output = "";
  for (var i = 0; i < binaryMessage.length; i += 8) {
    var c = 0;
    for (var j = 0; j < 8; j++) {
      c <<= 1;
      c |= parseInt(binaryMessage[i + j]);
    }

    output += String.fromCharCode(c);
  }

  var passwd = $("textarea.decodepassword").val().toString();
  decrypted = decrypt(output.substring(0, MAX_ENCRYPTED), passwd).split("|ö|")[0];

  //$('.binary-decode textarea').text(output.substring(0,232)+"  -----"+output.substring(0, 232).length+"---- "+decrypted);
  $('.binary-decode textarea').text(decrypted);
  $('.binary-decode').fadeIn();
};

function encrypt(msg, passwd) {
  let encJson = CryptoJS.AES.encrypt(JSON.stringify(msg), passwd).toString()
  let encData = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(encJson))
  return encData
}

function decrypt(msg, passwd) {
  let decData = CryptoJS.enc.Base64.parse(msg).toString(CryptoJS.enc.Utf8)
  let bytes = CryptoJS.AES.decrypt(decData, passwd).toString(CryptoJS.enc.Utf8)
  return JSON.parse(bytes)
}

function randomBytes(length) {
  var result = '';
  var characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  for ( var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random()*characters.length));
  }
  return result
}

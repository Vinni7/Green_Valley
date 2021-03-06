'use strict';

// Использование: node createBlock.js [имя блока] [доп. расширения через пробел]

const fs = require('fs');                // будем работать с файловой системой
const mkdirp = require('mkdirp');        // зависимость

let blockName = process.argv[2];          // получим имя блока
let defaultExtensions = ['less']; // расширения по умолчанию
let extensions = uniqueArray(defaultExtensions.concat(process.argv.slice(3)));  // добавим введенные при вызове расширения (если есть)

// Если есть имя блока
if(blockName) {

  let dirPath = 'src/less/blocks/'; // полный путь к создаваемой папке блока
  mkdirp(dirPath, function(err){                            // создаем

    // Если какая-то ошибка — покажем
    if(err) {
      console.error('[NTH] Отмена операции: ' + err);
    }

    // Нет ошибки, поехали!
    else {
      // console.log('[NTH] Создание папки ' + dirPath + ' (создана, если ещё не существует)');

      // Читаем файл диспетчера подключений
      let connectManager = fs.readFileSync('src/less/style.less', 'utf8');

      // Делаем из строк массив, фильтруем массив, оставляя только строки с незакомментированными импортами
      let fileSystem = connectManager.split('\n').filter(function(item) {
        if(/^(\s*)@import/.test(item)) return true;
        else return false;
      });

      // Обходим массив расширений и создаем файлы, если они еще не созданы
      extensions.forEach(function(extention){

        let filePath = dirPath + blockName + '.' + extention; // полный путь к создаваемому файлу
        let fileContent = '';                                 // будущий контент файла
        let LESSfileImport = '';                              // конструкция импорта будущего LESS
        let fileCreateMsg = '';                               // будущее сообщение в консоли при создании файла

        // Если это LESS
        if(extention == 'less') {
          LESSfileImport = '@import \'blocks/' + blockName + '.less\';';
          fileContent = '// Для импорта в диспетчер подключений: ' + LESSfileImport + '\n\n@import \'../variables.less\';     // только для удобства обращения к переменным\n\n\n.' + blockName + ' {\n  \n}\n';
          fileCreateMsg = '[NTH] Для импорта стилей: ' + LESSfileImport;

          // Создаем регулярку с импортом
          let reg = new RegExp(LESSfileImport, '');

          // Создадим флаг отсутствия блока среди импортов
          let impotrtExist = false;

          // Обойдём массив и проверим наличие импорта
          for (var i = 0, j=fileSystem.length; i < j; i++) {
            if(reg.test(fileSystem[i])) {
              impotrtExist = true;
              break;
            }
          }

          // Если флаг наличия импорта по-прежнему опущен, допишем импорт
          if(!impotrtExist) {
            // Открываем файл
            fs.open('src/less/style.less', 'a', function(err, fileHandle) {
              // Если ошибок открытия нет...
              if (!err) {
                // Запишем в конец файла
                fs.write(fileHandle, LESSfileImport + '\n', null, 'utf8', function(err, written) {
                  if (!err) {
                    console.log('[NTH] В диспетчер подключений (src/less/style.less) записано: ' + LESSfileImport);
                  } else {
                    console.log('[NTH] ОШИБКА записи в src/less/style.less: ' + err);
                  }
                });
              } else {
                console.log('[NTH] ОШИБКА открытия src/less/style.less: ' + err);
              }
            });
          }
          else {
            console.log('[NTH] Импорт НЕ прописан в src/less/style.less (он там уже есть)');
          }
        }

        // Создаем файл, если он еще не существует
        if(fileExist(filePath) === false) {
          fs.writeFile(filePath, fileContent, function(err) {
            if(err) {
              return console.log('[NTH] Файл НЕ создан: ' + err);
            }
            console.log('[NTH] Файл создан: ' + filePath);
            if(fileCreateMsg) {
              console.warn(fileCreateMsg);
            }
          });
        }
        else {
          console.log('[NTH] Файл НЕ создан: ' + filePath + ' (уже существует)');
        }
      });
    }
  });
}
else {
  console.log('[NTH] Отмена операции: не указан блок');
}

// Оставить в массиве только уникальные значения (убрать повторы)
function uniqueArray(arr) {
  var objectTemp = {};
  for (var i = 0; i < arr.length; i++) {
    var str = arr[i];
    objectTemp[str] = true; // запомнить строку в виде свойства объекта
  }
  return Object.keys(objectTemp);
}

// Проверка существования файла
function fileExist(path) {
  const fs = require('fs');
  try {
    fs.statSync(path);
  } catch(err) {
    return !(err && err.code === 'ENOENT');
  }
}
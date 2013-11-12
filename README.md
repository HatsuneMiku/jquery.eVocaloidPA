# jquery.eVocaloidPA
ひらがなで入力された歌詞などをeVocaloidの発音記号やNSX-1の仕様に基づいたSysEx Binaryに変換します。
## Demo
http://jsdo.it/nyapricoton/3KJa
## Usage
### Simple
    $('input, textarea').eVocaloidPA();
### Custom keyup event
    $('input, textarea').eVocaloidPA(
        keyup: function(instance) {
            instance.update();
            
            //...
        }
    );

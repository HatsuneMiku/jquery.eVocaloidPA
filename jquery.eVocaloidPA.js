/* v0.1 @apricoton */
;(function($){
    var toString = Object.prototype.toString;
    var slice = Array.prototype.slice;
    
    $.fn.eVocaloidPA = function(options) {
        var args = arguments;
        return this.each(function() {
            var instance = $.data(this, 'eVocaloidPA');
            if (!instance) {
                instance = new EVocaloidPA(this);
                $.data(this, 'eVocaloidPA', instance);
            }
            instance.dispatch.apply(instance, args);
            
            $(this).on('keyup', function() {
                instance.config.keyup(instance);
            });
        });
    };
    
    function EVocaloidPA(element) {
        this.element = element;
        this.object  = $(element);
        this.config  = $.extend({}, EVocaloidPA.default_options);
        this.update();
    }
    
    $.extend(EVocaloidPA.prototype, {
        dispatch: function(args) {
            switch (toString.call(args)) {
                case '[object Object]':
                    this.setConfig(args);
                    break;
                case '[object String]':
                    this[args].apply(this, slice.call(arguments, 1));
                    break;
            }
        },
        setConfig: function(config) {
            this.config = $.extend(this.config, config);
        },
        update: function() {
            var instance = this;
            var object   = this.object;
            var config   = this.config;
            var element  = this.element;
            var lines    = object.val().split(config.separator.line);
            
            // データを初期化
            this.data = {
                pa: [],
                ints: [],
                blob: {},
            };
            
            $.each(lines, function(line_index, line) {
                var chars = line.split('');
                $.each(chars, function(char_index, target) {
                    var current   = chars[char_index];
                    var next      = chars[char_index + 1];
                    var afternext = chars[char_index + 2];
                    var pa;
                    
                    // 対象が「ん」の場合
                    if (current == 'ん') {
                        // 行末は語末とみなす
                        if (!next) {
                            instance.push_pa("N\\");
                            return;
                        }
                        
                        // 次に続く最大2文字で判別
                        pa = instance.search(next + afternext);
                        if (!pa) {
                             pa =  instance.search(next);
                        }
                        if (pa) {
                            if(pa.match(/^a|^i|^M|^e|^o|^j|^w|^p\\/)) {
                                instance.push_pa("N\\");
                                return;
                            }
                            if(pa.match(/^p\s|b\s|m\s/)) {
                                instance.push_pa("m");
                                return;
                            }
                            if(pa.match(/^p'|b'|m'/)) {
                                instance.push_pa("m'");
                                return;
                            }
                            if(pa.match(/^k\s|g\s|N\s/)) {
                                instance.push_pa("N");
                                return;
                            }
                            if(pa.match(/^k'|g'|N'/)) {
                                instance.push_pa("N'");
                                return;
                            }
                            if(pa.match(/^J\s/)) {
                                instance.push_pa("J");
                                return;
                            }
                        }
                        instance.push_pa("n");
                    }
                    
                    // 次の文字がある場合
                    if (next) {
                        pa = instance.search(current + next);
                        if (pa) {
                            instance.push_pa(pa);
                            return;
                        }
                    }
                    
                    // 一文字で検索
                    pa = instance.search(current);
                    if (pa) {
                        instance.push_pa(pa);
                    }
                });
                instance.data.pa.push(config.separator.line);
            });
            
            instance.create_ints();
            instance.create_blob();
            $.data(element, 'eVocaloidPAData', instance.data);
        },
        push_pa: function(val) {
            this.data.pa.push(val);
            this.data.pa.push(this.config.separator.pa);
        },
        create_ints: function() {
            var instance = this;
            instance.data.ints = [0xF0, 0x43, 0x79, 0x09, 0x0F, 0x50, this.config.mode];
            $.each(instance.data.pa, function(pa_index, pa) {
                if (pa == instance.config.separator.line) {
                    return;
                }
                $.each(pa.split(''), function(index, value) {
                    instance.data.ints.push(value.charCodeAt());
                });
            });
            instance.data.ints.push(0xF0);
        },
        create_blob: function() {
            var instance = this;
            var ints = new Uint8Array(instance.data.ints);
            var blob = new Blob([ints], { type: 'application/octet-stream' });
            var url = window.URL.createObjectURL(blob);
            
            instance.data.blob = {
                ints: ints,
                blob: blob,
                url: url,
            }
        },
        search: function(kana) {
            var pa = this.config.chars.kana.indexOf(kana);
            return (pa >= 0) ? this.config.chars.pa[pa] : null;
        },
    });
    
    EVocaloidPA.default_options = {
        separator: {
            line: "\n",
            pa: ',',
        },
        mode: 0x10,
        keyup: function(instance) {
            instance.update();
        },
        chars: {
            kana: [
                "あ",   "い",   "う",   "え",   "お",
                "か",   "き",   "く",   "け",   "こ",
                "さ",   "し",   "す",   "せ",   "そ",
                "た",   "ち",   "つ",   "て",   "と",
                "な",   "に",   "ぬ",   "ね",   "の",
                "は",   "ひ",   "ふ",   "へ",   "ほ",
                "ま",   "み",   "む",   "め",   "も",
                "ら",   "り",   "る",   "れ",   "ろ",
                "が",   "ぎ",   "ぐ",   "げ",   "ご",
                "ざ",   "じ",   "ず",   "ぜ",   "ぞ",
                "だ",   "ぢ",   "づ",   "で",   "ど",
                "ば",   "び",   "ぶ",   "べ",   "ぼ",
                "ぱ",   "ぴ",   "ぷ",   "ぺ",   "ぽ",
                "や",   "ゆ",   "よ",
                "わ",   "ゐ",   "ゑ",   "を",
                "ふぁ", "つぁ",
                "うぃ", "すぃ", "ずぃ", "つぃ", "てぃ",
                "でぃ", "ふぃ",
                "とぅ", "どぅ",
                "いぇ", "うぇ", "きぇ", "しぇ", "ちぇ",
                "つぇ", "てぇ", "にぇ", "ひぇ", "みぇ",
                "りぇ", "ぎぇ", "じぇ", "でぇ", "びぇ",
                "ぴぇ", "ふぇ",
                "うぉ", "つぉ", "ふぉ",
                "きゃ", "しゃ", "ちゃ", "てゃ", "にゃ",
                "ひゃ", "みゃ", "りゃ", "ぎゃ", "じゃ",
                "でゃ", "びゃ", "ぴゃ", "ふゃ",
                "きゅ", "しゅ", "ちゅ", "てゅ", "にゅ",
                "ひゅ", "みゅ", "りゅ", "ぎゅ", "じゅ",
                "でゅ", "びゅ", "ぴゅ", "ふゅ",
                "きょ", "しょ", "ちょ", "てょ", "にょ",
                "ひょ", "みょ", "りょ", "ぎょ", "じょ",
                "でょ", "びょ", "ぴょ"
            ],
            pa: [
                "a",     "i",     "M",     "e",      "o",
                "k a",   "k' i",  "k M",   "k e",    "k o",
                "s a",   "S i",   "s M",   "s e",    "s o",
                "t a",   "tS i",  "ts M",  "t e",    "t o",
                "n a",   "J i",   "n M",   "n e",    "n o",
                "h a",   "C i",   "p\\ M", "h e",    "h o",
                "m a",   "m' i",  "m M",   "m e",    "m o",
                "4 a",   "4' i",  "4 M",   "4 e",    "4 o",
                "g a",   "g' i",  "g M",   "g e",    "g o",
                "dz a",  "dZ i",  "dz M",  "dz e",   "dz o",
                "d a",   "dZ i",  "dz M",  "d e",    "d o",
                "b a",   "b' i",  "b M",   "b e",    "b o",
                "p a",   "p' i",  "p M",   "p e",    "p o",
                "j a",   "j M",   "j o",
                "w a",   "w i",   "w e",   "o",
                "p\\ a", "ts a",
                "w i",   "s i",   "dz i",  "ts i",   "t' i",
                "d' i",  "p\' i",
                "t M",   "d M",
                "j e",   "w e",   "k' e",  "S e",    "tS e",
                "ts e",  "t' e",  "J e",   "C e",    "m' e",
                "4' e",  "g' e",  "dZ e",  "d' e",   "b' e",
                "p' e",  "p\\ e",
                "w o",   "ts o",  "p\\ o",
                "k' a",  "S a",   "tS a",  "t' a",   "J a",
                "C a",   "m' a",  "4' a",  "N' a",   "dZ a",
                "d' a",  "b' a",  "p' a",  "p\\' a",
                "k' M",  "S M",   "tS M",  "t' M",   "J M",
                "C M",   "m' M",  "4' M",  "g' M",   "dZ M",
                "d' M",  "b' M",  "p' M",  "p\\' M",
                "k' o",  "S o",   "tS o",  "t' o",   "J o",
                "C o",   "m' o",  "4' o",  "N' o",   "dZ o",
                "d' o",  "b' o",  "p' o"
            ]
        },
    };
    
    $.EVocaloidPA = EVocaloidPA;
})(jQuery);

// ==UserScript==
// @name         扫雷脚本
// @namespace    https://greasyfork.org/zh-CN/users/816246-jingaz
// @version      0.2
// @description  数字越大,踩雷概率越大,全屏难度需要一定时间计算
// @author       lj
// @match        http://www.minesweeper.cn/
// @icon         https://www.google.com/s2/favicons?domain=minesweeper.cn
// @grant        none
// ==/UserScript==

(function () {
    'use strict';
    // 添加开挂按钮
    document.querySelector("center div+div").innerHTML += '\n&nbsp; \n<a href="javascript:doit()">开挂</a>\n<label id="green_hit" style="color:green">green</label>&nbsp;<label id="red_hit"  style="color:red">red</label>';


    // 调用事件触发器
    function call_trigger(e, button_type) {
        let ev = new Event('mousedown');
        ev.button = button_type;
        e.dispatchEvent(ev);
    }
    var row, col;
    let game_state = document.getElementById('face');
    // 扫描整个棋盘
    window.doit = function () {
        row = document.querySelector('table#pad.pad > tbody').childElementCount;
        col = document.querySelector('table#pad.pad > tbody').firstChild.childElementCount;
        if (reverse_gif[game_state.src] == 'fail' || reverse_gif[game_state.src] == 'success') {
            console.log("game over");
            return;
        }
        // 消除格子的提示方框
        for (let i = 0; i < col; i++) {
            for (let j = 0; j < row; j++) {
                let elem = document.getElementById(i + '-' + j);
                elem.style.borderStyle = '';
            }
        }
        let tack_action = false;
        for (let i = 0; i < col; i++) {
            for (let j = 0; j < row; j++) {
                let elem = document.getElementById(i + '-' + j);
                if (typeof (reverse_gif[elem.style.background]) == 'number') {
                    const elem_value = reverse_gif[elem.style.background];
                    if (elem_value == 0) continue;
                    let { blank_elem, flag_elem, num_elem } = arround_position(i, j);
                    // elem_value-flag = 0，周围的空格需要挨个左键踩雷
                    if (0 == elem_value - flag_elem.length) {
                        for (const tmp of blank_elem) {
                            if (reverse_gif[tmp.style.background] == 'blank') {
                                call_trigger(tmp, 0);
                                tack_action = true;
                            }
                        }
                    }
                    // 周围的空白格数等于 elem_value-flag_elem.length，需要挨个右键插旗
                    else if (blank_elem.length == elem_value - flag_elem.length) {
                        for (const tmp of blank_elem) {
                            if (reverse_gif[tmp.style.background] == 'blank') {
                                call_trigger(tmp, 2);
                                tack_action = true;
                            }
                        }
                    }
                    // 判断相邻的数字num_tmp是否满足能够确定分布情况的某些定式
                    if (num_elem.length != 0) {
                        for (const num_tmp of num_elem) {
                            let num_blank = [];
                            let num_flag = [];
                            let tmp = [-1, 0, 1];
                            // 记录num_tmp元素周围独有的空白格和红旗格 和 elem元素相对于num_tmp独有的空白格和红旗格
                            for (const num_i of tmp) {
                                for (const num_j of tmp) {
                                    let _e_col = num_tmp.col + num_i;
                                    let _e_row = num_tmp.row + num_j;
                                    if (0 <= _e_col && _e_col < col && 0 <= _e_row && _e_row < row) {
                                        let elem = document.getElementById(_e_col + '-' + _e_row);
                                        if (reverse_gif[elem.style.background] == 'blank') {
                                            num_blank.push(elem);
                                        }
                                        if (reverse_gif[elem.style.background] == 'flag') {
                                            num_flag.push(elem);
                                        }
                                    }
                                }
                            }
                            let blank_elem_subset = blank_elem.filter(blank_elem_near_num_tmp => !num_blank.includes(blank_elem_near_num_tmp));
                            let flag_elem_subset = flag_elem.filter(flag_elem_near_num_tmp => !num_flag.includes(flag_elem_near_num_tmp));
                            let num_blank_subset = num_blank.filter(blank_elem_near_elem => !blank_elem.includes(blank_elem_near_elem));
                            let num_flag_subset = num_flag.filter(flag_elem_near_elem => !flag_elem.includes(flag_elem_near_elem));
                            let Ak = num_tmp.value - num_flag_subset.length;
                            let Bk = elem_value - flag_elem_subset.length;
                            if (Ak > Bk) {
                                let sub_mine = Ak - Bk;
                                // num_blank_subset 全是雷
                                if (num_blank_subset.length == sub_mine) {
                                    for (const tmp of num_blank_subset) {
                                        if (reverse_gif[tmp.style.background] == 'blank') {
                                            call_trigger(tmp, 2);
                                            tack_action = true;
                                        }
                                    }
                                }
                            } else if (Ak == Bk) {
                                if (blank_elem_subset.length == 0) {
                                    for (const tmp of num_blank_subset) {
                                        if (reverse_gif[tmp.style.background] == 'blank') {
                                            call_trigger(tmp, 0);
                                            tack_action = true;
                                        }
                                    }
                                }
                                if (num_blank_subset.length == 0) {
                                    for (const tmp of blank_elem_subset) {
                                        if (reverse_gif[tmp.style.background] == 'blank') {
                                            call_trigger(tmp, 0);
                                            tack_action = true;
                                        }
                                    }
                                }
                            }
                            else {
                                let sub_mine = Bk - Ak;
                                // blank_elem_subset 全是雷
                                if (blank_elem_subset.length == sub_mine) {
                                    for (const tmp of blank_elem_subset) {
                                        if (reverse_gif[tmp.style.background] == 'blank') {
                                            call_trigger(tmp, 2);
                                            tack_action = true;
                                        }
                                    }
                                }
                            }
                        } //end for
                    } //end if
                }
            }
        }
        if (tack_action == true) {
            return window.doit();
        }
        else {
            return hint();
        }
    }
    // 记录pos(e_col,e_row)周围空白元素、红旗元素、数字元素的数量和位置
    function arround_position(e_col, e_row) {
        let blank = [];
        let flag = [];
        let num = [];
        let tmp = [-1, 0, 1];
        for (const i of tmp) {
            for (const j of tmp) {
                let _e_col = e_col + i;
                let _e_row = e_row + j;
                if (0 <= _e_col && _e_col < col && 0 <= _e_row && _e_row < row) {
                    let elem = document.getElementById(_e_col + '-' + _e_row);
                    if (reverse_gif[elem.style.background] == 'blank') {
                        blank.push(elem);
                    }
                    else if (reverse_gif[elem.style.background] == 'flag') {
                        flag.push(elem);
                    } else {
                        elem.col = _e_col;
                        elem.row = _e_row;
                        elem.value = reverse_gif[elem.style.background];
                        num.push(elem);
                    }
                }
            }
        }
        return {
            blank_elem: blank,
            flag_elem: flag,
            num_elem: num,
        }
    }

    // 给踩雷概率最低的空白格画上绿框，概率最高的空白格画上红框
    function hint() {
        let blank_near_list = []; //数字周围的空白格
        let cur_mine = 100 * (reverse_gif[document.querySelector('#m10 > img').src]) + 10 * (reverse_gif[document.querySelector('#m10 > img +img').src]) + reverse_gif[document.querySelector('#m10 > img +img+img').src];

        for (let i = 0; i < col; i++) {
            for (let j = 0; j < row; j++) {
                let elem = document.getElementById(i + '-' + j);
                if (typeof (reverse_gif[elem.style.background]) == 'number') {
                    const elem_value = reverse_gif[elem.style.background];
                    if (elem_value == 0) continue;
                    let { blank_elem, flag_elem, num_elem } = arround_position(i, j);
                    let has_mine_probability = (elem_value - flag_elem.length) / parseFloat(blank_elem.length);
                    for (const e of blank_elem) {
                        if (blank_near_list.indexOf(e) == -1) {
                            e.no_mine_probability = 1 - has_mine_probability;
                            blank_near_list.push(e);
                        } else {
                            e.no_mine_probability *= (1 - has_mine_probability);
                        }
                    }
                }
            }
        }
        let min_probaility = 1, max_probaility = 0;
        let min_probaility_elem_id = [], max_probaility_elem_id = [];
        for (const e of blank_near_list) {
            if (min_probaility > e.no_mine_probability) {
                min_probaility = e.no_mine_probability;
                min_probaility_elem_id.length = 0;
                min_probaility_elem_id.push(e.id);
            } else if (min_probaility == e.no_mine_probability) {
                min_probaility_elem_id.push(e.id);
            }
            if (max_probaility < e.no_mine_probability) {
                max_probaility = e.no_mine_probability;
                max_probaility_elem_id.length = 0;
                max_probaility_elem_id.push(e.id);
            } else if (max_probaility == e.no_mine_probability) {
                max_probaility_elem_id.push(e.id);
            }
        }

        // 保存远离数字的空白格位置
        let blank_away_list = [];
        for (let i = 0; i < col; i++) {
            for (let j = 0; j < row; j++) {
                let elem = document.getElementById(i + '-' + j);
                if (reverse_gif[elem.style.background] == 'blank' && blank_near_list.indexOf(elem) == -1) {
                    blank_away_list.push(elem);
                }
            }
        }
        let blank_away_probaility = 1 - cur_mine / parseFloat(blank_away_list.length + blank_near_list.length);
        if (blank_away_probaility < min_probaility) {
            for (const e of blank_away_list) {
                e.style.borderColor = 'red';
                e.style.borderStyle = 'dashed';
            }
            for (const id of max_probaility_elem_id) {
                let max_probaility_elem = document.getElementById(id);
                max_probaility_elem.style.borderColor = 'green';
                max_probaility_elem.style.borderStyle = 'dashed';
            }
            document.getElementById('green_hit').innerText = (1 - max_probaility).toFixed(2);;
            document.getElementById('red_hit').innerText = (1 - blank_away_probaility).toFixed(2);;
        }
        else if (blank_away_probaility > max_probaility) {
            for (const e of blank_away_list) {
                e.style.borderColor = 'green';
                e.style.borderStyle = 'dashed';
            }
            for (const id of min_probaility_elem_id) {
                let min_probaility_elem = document.getElementById(id);
                min_probaility_elem.style.borderColor = 'red';
                min_probaility_elem.style.borderStyle = 'dashed';
            }
            document.getElementById('green_hit').innerText = (1 - blank_away_probaility).toFixed(2);;
            document.getElementById('red_hit').innerText = (1 - min_probaility).toFixed(2);;
        }
        else {
            for (const id of min_probaility_elem_id) {
                let min_probaility_elem = document.getElementById(id);
                min_probaility_elem.style.borderColor = 'red';
                min_probaility_elem.style.borderStyle = 'dashed';
            }
            for (const id of max_probaility_elem_id) {
                let max_probaility_elem = document.getElementById(id);
                max_probaility_elem.style.borderColor = 'green';
                max_probaility_elem.style.borderStyle = 'dashed';
            }
            document.getElementById('green_hit').innerText = (1 - max_probaility).toFixed(2);;
            document.getElementById('red_hit').innerText = (1 - min_probaility).toFixed(2);;
        }
    }
    // 背景图片和属性对照表
    var reverse_gif = {};
    reverse_gif['url("data:img/gif;base64,R0lGODlhGQAZAKIAAM7OzsbGxr6+vra2trKysqampoKCggAAACH5BAAHAP8ALAAAAAAZABkAAANHaLrc3mWQSau9xAwQuv9gGBhEIJxoqq4CabLw6sY0Otf0jcP6Lpc+HjD4exFTvWNrqDwlj09iNDj1VXdXXLa2zTGb3VgYlgAAOw==")'] = 0;
    reverse_gif['url("data:img/gif;base64,R0lGODlhGQAZAJEAAMDAwICAgAAA/wAAACH5BAAHAP8ALAAAAAAZABkAAAJMjI+py70Ao5wUmorxzTxuLIRC9lFiSAbZOWqqybZVCcWoC8fpeu5gj/uJfBUWMXebvYpAJdJGoQFsTc8yQh1OpJ3otesEH8XbLzlSAAA7")'] = 1;
    reverse_gif['url("data:img/gif;base64,R0lGODlhGQAZALMAAMDAwKu5q6i4qKW3pZy0nJaylpCwkIquioCAgACAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAAHAP8ALAAAAAAZABkAAAReEMlJq704X8C7/yAnhSQ5lmh3cknrvi64wvT7zXV9I50N+ipeihXzrFACoEhYMtB2pSSsIGN6CrRBIHQEEGjb0pEmGOJch+Gyl3samW13kB0vztViKx665+r7a4AfEQA7")'] = 2;
    reverse_gif['url("data:img/gif;base64,R0lGODlhGQAZAJEAAMDAwICAgP8AAAAAACH5BAQUAP8ALAAAAAAZABkAAAJOjI+py70Ao5wUmorxzTxuIITiOFIfiZbSmabT16le0EWyRdeg+OZTGzL5JECBsFI86m4AGIfpzEB9RVLPVuWtqFnjVZeJgmdjzbBMRk8KADs=")'] = 3;
    reverse_gif['url("data:img/gif;base64,R0lGODlhGQAZAJEAAMDAwICAgAAAmQAAgCH5BAAHAP8ALAAAAAAZABkAAAJdjI+py70Ao5wUmorxzTzuOgjAQJLUN5FiaU5oVK7sGVAxxA50Gor47KrBVJLc7hfilY6jnHMp+TynwYjgisXmfB4hx1jtgKPezLjbaULJ6bOlnK684mG6HG5H5ykFADs=")'] = 4;
    reverse_gif['url("data:img/gif;base64,R0lGODlhGQAZAJEAAMDAwICAgIAAAAAAACH5BAQUAP8ALAAAAAAZABkAAAJOjI+py70Ao5wUmorxzTxuIITiSE4fiY5mEKXu2oodDKmzx9bybeWgW6L9gDZcjLgz3oo9HhPw6TxPyGRTVxUIs1ohjxL9SsLia3nsO0MKADs=")'] = 5;
    reverse_gif['url("data:img/gif;base64,R0lGODlhGQAZAJEAAMDAwICAgACAgAAAACH5BAQUAP8ALAAAAAAZABkAAAJTjI+py70Ao5wUmorxzTxuKITiKFIfiZbTmaJmEI3dCoPqbNWAjOdxS3r9gDyPjhiUsEKVos/GpDgBS0Hz9twhsdTjNmqUfIU9ja5MQ1c+6nBbUgAAOw==")'] = 6;
    reverse_gif['url("data:img/gif;base64,R0lGODlhGQAZAJEAAL6+voKCggAAAAAAACH5BAAHAP8ALAAAAAAZABkAAAJMjI+py70Ao5wUmorxzTxuIITiSE4fiY5mEKXu2rUiHIOz9HElznY771NRcpQfrWI8TpJK2S1DtD2hPWeoRhTGojVgV1P9NsWWMBlSAAA7")'] = 7;
    reverse_gif['url("data:img/gif;base64,R0lGODlhGQAZAIAAAMDAwICAgCH5BAQUAP8ALAAAAAAZABkAAAJKjI+py70Ao5wUmorxzTxu63xeMIYi8JnHlK4UwpLgOctjaUuwnqtvb/rxQsJaZXcz/k4tGsqVfPp4OCK1yih2OM7t1avJgWNjTAEAOw==")'] = 8;
    reverse_gif['url("data:img/gif;base64,R0lGODlhGQAZAJEAAP///8DAwICAgAAAACH5BAQUAP8ALAAAAAAZABkAAAJKhI+pFrH/GpwnCFGb3nxfzHQi92XjWYbnmAIrepkvGauzV7s3Deq71vrhekJgrtgIIpVFptD5g+6kN+osZflot9xPsgvufsPkSwEAOw==")'] = "blank";
    reverse_gif['url("data:img/gif;base64,R0lGODlhGQAZAJEAAP///4CAgP8AAAAAACH5BAQUAP8ALAAAAAAZABkAAAJgjI+py70Co5wUmhrHwPFyzVlBCIYeBGqqik6nkK4s7I6TjFOvCvR42bGhND3AbyPZEX2/GuwILV2iUZGEOgtesUhthuu8VcNbqE74fOZoSTQFiHm9u3G3OCSQ4yv6/aQAADs=")'] = "blood";
    reverse_gif['url("data:img/gif;base64,R0lGODlhGQAZAKIAAP///8DAwICAgP8AAAAAAAAAAAAAAAAAACH5BAAHAP8ALAAAAAAZABkAAANsCLrcriG8OSO9KwiRo//gt3FQaIJjZw7DmZYh25ovEMtzWH+47G6qno8GhAWEOVTRBur9SMxbUrQ8BQiEpyqE1RpBXSLUGtZVI9i0Wu3ZodfwbMR9ja/bZ6s3qjeTNCOBgoMjc4SHhIaIixsJADs=")'] = "flag";
    reverse_gif['url("data:img/gif;base64,R0lGODlhGQAZAJEAAP///76+voKCggAAACH5BAAHAP8ALAAAAAAZABkAAAJglI+py70Bo5wUmhrHwPFyzVlCCIYeBGqqik5nkK4s7I6TjFOvCvR42bGhND3AbyPZEX2/GuwILV2iUZGEOgtesUhthuu8VcNbqE74fOZoSTQFiHm9u3G3OBSQ4yv6/aQAADs=")'] = "mine";
    reverse_gif['url("data:img/gif;base64,R0lGODlhGQAZANUAAP8AAMDAwICAgPbW1vmBgfcxMfa9vPogIPlYWPehov////lISPoJCPh0dPeXl/fDw/e2tvorKvg5OfoREPbn5/llZferq/dBQfscHPwpKfWMjPecnPlSUvbLy/l/f/wICP0NDfbb2/lsbAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAAHAP8ALAAAAAAZABkAAAbKQIVwSCwahYHAcblMMp/DgEAQTVqv2OuUigxEABhLdryNbgBoQGccaDSSZaQmDchkIRl0oRNXBChfaRJXFnQACH1JAyB0BUmFhiKJSQmGHHOGE1JTVZSGn3abXH6En2kcVpNXBh+GIBpanF1XGh+taRFYqkkepgCDqbKkSRx0EQYEgsGjVgd0FVZnenDCSQgAt7BXDxcTHGKJGxNpG2wdBhCiQwYXDAwL6WyxXBQbBQcO8llx6GL6+7JCbBlIsOBAagYTFkSosKGAIAA7")'] = "no";
    reverse_gif["data:img/gif;base64,R0lGODlhFAAUAJEAAP//AL29vQAAAAAAACH5BAQUAP8ALAAAAAAUABQAAAJBjI+py30CoXsCWCtbvRwItnXcl2xVeGLlFWIsgnqsrBqt2JHBjb92j9PdIpAcbDbyPVwik4JnXEBroKHOQbxOtgUAOw=="] = "fail";
    reverse_gif["data:img/gif;base64,R0lGODlhFAAUAJEAAAAAAP//AMDAwICAACH5BAQUAP8ALAAAAAAUABQAAAJHlI+py30AoXsgWCtbvTwAtnXcl4TiWGLRupFGu3qx93gydFc6ZQ24OlDVTieXiXhxCUJHZio5wyiOIiWCmnT8oJPXqgs2FAAAOw=="] = "success";
    reverse_gif["data:img/gif;base64,R0lGODlhDQAXAJEAAP8AAIAAAAAAAAAAACH5BAQUAP8ALAAAAAANABcAAAI5lI8Jy3wgmoMRymoc0vqt/G1hB1JkZVKKaQSC60YI/NZPW8dpApZrqvKhfkIPkIi5jFANWUkS5CUKADs="] = 0;
    reverse_gif["data:img/gif;base64,R0lGODlhDQAXAJEAAP8AAIAAAAAAAAAAACH5BAQUAP8ALAAAAAANABcAAAI3lI8psc33mDQAmilAdUnv1mkXeHhWuGGlOCpsxGXIpII0dYbjs358v0PlgDGiDfQKPj6cmkJRAAA7"] = 1;
    reverse_gif["data:img/gif;base64,R0lGODlhDQAXAJEAAP8AAIAAAAAAAAAAACH5BAQUAP8ALAAAAAANABcAAAI8lI8Jy3whmgMvNmsgRC4nSwmaslRkOHKl962QVIYgfFAwta3JBu6i0UHwgp6cztQT/jCSZWTmGN5kn08BADs="] = 2;
    reverse_gif["data:img/gif;base64,R0lGODlhDQAXAJEAAP8AAIAAAAAAAAAAACH5BAQUAP8ALAAAAAANABcAAAI5lI8Jy3whmgMvNmsgRC4nSwmaslRkOHKl962QVIYgXMGUvJFebnRi6/qpcECU8OB7XYK2CNIm+3wKADs="] = 3;
    reverse_gif["data:img/gif;base64,R0lGODlhDQAXAJEAAP8AAIAAAAAAAAAAACH5BAQUAP8ALAAAAAANABcAAAI8lI8psc0HDJsmCmDptdhCXIFIF3rlOYpkyplftXWgJ9cHU8+3skkNu0usNB/PA+gQin4a0YPyMEF/PF4BADs="] = 4;
    reverse_gif["data:img/gif;base64,R0lGODlhDQAXAJEAAP8AAIAAAAAAAAAAACH5BAQUAP8ALAAAAAANABcAAAI5lI8Jy3wgmgtmxSZotYhql2gX1GUbWZ6heSWGCEkWLHNmHR0iwnmKvVOZgiAWr2cU3jBIHKpmc7kKADs="] = 5;
    reverse_gif["data:img/gif;base64,R0lGODlhDQAXAJEAAP8AAIAAAAAAAAAAACH5BAQUAP8ALAAAAAANABcAAAI5lI8Jy3wgmgtmxSZotYhql2gX1GUbWZ6heSWGCEkWLHPRiJE2woFPvxupeEDU0HeM5XQ4B6oWdCEKADs="] = 6;
    reverse_gif["data:img/gif;base64,R0lGODlhDQAXAJEAAP8AAIAAAAAAAAAAACH5BAQUAP8ALAAAAAANABcAAAI5lI8Jy3whmgMvNmsgRC4nSwmaslRkOHKl963buIUejLziHZnkfOpHl/qtcCoU0dDBpVy8WO0W/EgLADs="] = 7;
    reverse_gif["data:img/gif;base64,R0lGODlhDQAXAIAAAP8AAAAAACH5BAQUAP8ALAAAAAANABcAAAI0jI8Jy3wQmoMRymoc0vqt/G1hB1JkZVKKiTaRJ4VvbIGJja6pWvbirvPBbJdRawKL3ZaGAgA7"] = 8;
    reverse_gif["data:img/gif;base64,R0lGODlhDQAXAJEAAP8AAIAAAAAAAAAAACH5BAQUAP8ALAAAAAANABcAAAI6lI8Jy3wgmoMRymoc0vqt/G1hB1JkZVKKiTaRJ4VC0E4HnWDzLqp4b6D9SrecRrjy1XS0mAUWy0kNBQA7"] = 9;

})();
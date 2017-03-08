
/**
 * 提供文档演示的相关接口。
 */
var Doc = {

    // #endregion

    /**
     * 调用远程 node 服务器完成操作。
     */
    callService: function (cmdName, success) {
        var url = Doc.servicesUrl + cmdName;
        Doc.loadScript(url, success, function () {
            alert('请求服务 ' + url + ' 错误。请先执行 [项目跟目录]/assets/server-boot.cmd 启动服务器');
        });
    },

    trace: trace

    // #endregion

};

// 判断当前系统是否在后台运行。
if (typeof module === 'object' && typeof __dirname === 'string') {
    Doc.basePath = require('path').resolve(__dirname, Doc.basePath) + require('path').sep;
    module.exports = Doc;
} else {
    Doc.initPage();
}

// #region trace

/**
 * Print variables to console.
 * @param {Object} ... The variable list to print.
 */
function trace() {
    // Enable to disable all trace calls.
    if (!trace.disabled) {

        // If no argument exists. Use (trace: id) instead
        // For usages like: callback = trace;
        if (!arguments.length) {
            trace.$count = trace.$count || 0;
            return trace('(trace: ' + trace.$count++ + ')');
        }

        // Use console if available.
        if (window.console) {

            // Check console.debug
            if (typeof console.debug === 'function') {
                return console.debug.apply(console, arguments);
            }

            // Check console.log
            if (typeof console.log === 'function') {
                return console.log.apply(console, arguments);
            }

            // console.log.apply is undefined in IE 7/8.
            if (console.log) {
                return console.log(arguments.length > 1 ? arguments : arguments[0]);
            }

        }

        // Fallback to call trace.write, which calls window.alert by default.
        return trace.write.apply(trace, arguments);

    }
}

/**
 * Display all variables to user. 
 * @param {Object} ... The variable list to print.
 * @remark Differs from trace(), trace.write() preferred to using window.alert. 
 * Overwrite it to disable window.alert.
 */
trace.write = function () {

    var r = [], i = arguments.length;

    // dump all arguments.
    while (i--) {
        r[i] = trace.dump(arguments[i]);
    }

    window.alert(r.join('    '));
};

/**
 * Convert any objects to readable string. Same as var_dump() in PHP.
 * @param {Object} obj The variable to dump.
 * @param {Number} maxLevel=3 The maximum count of recursion.
 * @returns String The dumped string.
 */
trace.dump = function (obj, maxLevel, level) {

    if (level == null) level = 1;
    if (maxLevel == null) maxLevel = 4;

    switch (typeof obj) {
        case "function":
            return level < maxLevel ? obj.toString().replace(/\\u([0-9a-f]{3})([0-9a-f])/gi, function (a, b, c) {
                return String.fromCharCode((parseInt(b, 16) * 16 + parseInt(c, 16)))
            }) : "function() { ... }";

        case "object":
            if (obj == null) return "null";
            if (level >= maxLevel) return obj.toString();

            if (typeof obj.length === "number") {
                var r = [];
                for (var i = 0; i < obj.length; i++) {
                    r.push(trace.dump(obj[i], maxLevel, level));
                }
                return "[" + r.join(", ") + "]";
            } else {
                if (obj.setInterval && obj.resizeTo) return "window#" + obj.document.URL;

                if (obj.nodeType) {
                    if (obj.nodeType == 9) return 'document ' + obj.URL;
                    if (obj.tagName) {
                        var tagName = obj.tagName.toLowerCase(), r = tagName;
                        if (obj.id) {
                            r += "#" + obj.id;
                            if (obj.className)
                                r += "." + obj.className;
                        } else if (obj.outerHTML)
                            r = obj.outerHTML;
                        else {
                            if (obj.className)
                                r += " class=\"." + obj.className + "\"";
                            r = "<" + r + ">" + obj.innerHTML + "</" + tagName + ">  ";
                        }

                        return r;
                    }

                    return '<Node type=' + obj.nodeType + ' name=' + obj.nodeName + ' value=' + obj.nodeValue + '>';
                }
                var r = "{\r\n", i, flag = 0;
                for (i in obj) {
                    if (typeof obj[i] !== 'function')
                        r += new Array(level + 1).join('\t') + i + ": " + trace.dump(obj[i], maxLevel, level + 1) + ",\n";
                    else {
                        flag++;
                    }
                }

                if (flag) {
                    r += '    ... (' + flag + ' more)\r\n';
                }

                r = r.replace(/,\n$/, '');

                r += "\n" + new Array(level).join('\t') + "}";
                return r;
            }
        case "string":
            return '"' + obj.replace(/"/g, "\\\"").replace(/\n/g, "\\n\\\n") + '"';
        default:
            return String(obj);
    }
};

/**
 * Print a log to console.
 * @param {String} message The message to print.
 * @type Function
 */
trace.log = function (message) {
    if (!trace.disabled && window.console && console.log) {
        return console.log(message);
    }
};

/**
 * Print a error to console.
 * @param {String} message The message to print.
 */
trace.error = function (message) {
    if (!trace.disabled) {
        if (window.console && console.error)
            return console.error(message); // This is a known error which is caused by mismatched argument in most time.
        else
            throw message; // This is a known error which is caused by mismatched argument in most time.
    }
};

/**
 * Print a warning to console.
 * @param {String} message The message to print.
 */
trace.warn = function (message) {
    if (!trace.disabled) {
        return window.console && console.warn ? console.warn(message) : trace("[WARNING]", message);
    }
};

/**
 * Print a inforation to console.
 * @param {String} message The message to print.
 */
trace.info = function (message) {
    if (!trace.disabled) {
        return window.console && console.info ? console.info(message) : trace("[INFO]", message);
    }
};

/**
 * Print all members of specified variable.
 * @param {Object} obj The varaiable to dir.
 */
trace.dir = function (obj) {
    if (!trace.disabled) {
        if (window.console && console.dir)
            return console.dir(obj);
        else if (obj) {
            var r = "", i;
            for (i in obj)
                r += i + " = " + trace.dump(obj[i], 1) + "\r\n";
            return trace(r);
        }
    }
};

/**
 * Clear console if possible.
 */
trace.clear = function () {
    return window.console && console.clear && console.clear();
};

/**
 * Test the efficiency of specified function.
 * @param {Function} fn The function to test, which will be executed more than 10 times.
 */
trace.time = function (fn) {

    if (typeof fn === 'string') {
        fn = new Function(fn);
    }

    var time = 0,
        currentTime,
        start = +new Date(),
        past;

    try {

        do {

            time += 10;

            currentTime = 10;
            while (--currentTime > 0) {
                fn();
            }

            past = +new Date() - start;

        } while (past < 100);

    } catch (e) {
        return trace.error(e);
    }
    return trace.info("[TIME] " + past / time);
};

// #endregion

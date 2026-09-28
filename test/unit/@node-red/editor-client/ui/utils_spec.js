/**
 * Copyright JS Foundation and other contributors, http://js.foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/
const should = require("should");

const NR_TEST_UTILS = require("nr-test-utils");

const utilsPath = NR_TEST_UTILS.resolve("@node-red/editor-client/src/js/ui/utils.js");

describe("editor-client/ui/utils palette theme", function() {
    let mockRED;

    beforeEach(function() {
        global.window = { marked: require("marked"), _marked: require("marked") };
        global.$ = function() {
            return {
                find: () => ({ length: 0, remove() {} }),
                appendTo: () => ({}),
                css() { return this; },
                addClass() { return this; },
                attr() { return this; }
            };
        };

        const paletteTheme = [
            { type: 'inject', color: '#e4d725' },
            { type: 'inject', icon: 'theme/icons/fruit-theme/banana.png' },
            { category: 'fruit.*', icon: 'font-awesome/fa-apple' },
            { type: 'sub-.*', color: '#112233' },
            { type: '.*', color: 'red' }
        ];

        mockRED = {
            settings: {
                apiRootUrl: "",
                theme: function(property, defaultValue) {
                    if (property === "palette.theme") {
                        return paletteTheme;
                    }
                    return defaultValue;
                }
            },
            nodes: {
                fontAwesome: { getIconUnicode: () => null },
                getIconSets: () => ({
                    "font-awesome": ["fa-apple", "fa-star"]
                })
            },
            text: { bidi: { enforceTextDirectionWithUCC: (x) => x } }
        };
        global.RED = mockRED;

        delete require.cache[utilsPath];
        require(utilsPath);
    });

    afterEach(function() {
        delete global.RED;
        delete global.window;
        delete global.$;
        delete require.cache[utilsPath];
    });

    describe("getNodeColor", function() {
        it("uses the first matching rule that provides a color", function() {
            const def = { type: "inject", category: "function", color: "#ffffff" };
            // First rule matches and has a color; the catch-all is ignored
            RED.utils.getNodeColor("inject", def).should.eql("#e4d725");
        });

        it("skips rules that only carry an icon when resolving color", function() {
            // 'sub-a' does not match the color-only inject rule; the second
            // inject rule is icon-only so must not mask the sub-.* color rule
            const def = { type: "sub-a", category: "function", color: "#ffffff" };
            RED.utils.getNodeColor("sub-a", def).should.eql("#112233");
        });

        it("falls through to the wildcard color rule", function() {
            const def = { type: "debug", category: "function", color: "#ffffff" };
            RED.utils.getNodeColor("debug", def).should.eql("red");
        });
    });

    describe("getNodeIcon", function() {
        it("uses the icon from the first matching icon rule", function() {
            const def = { type: "inject", category: "function", icon: "arrow-in.svg" };
            RED.utils.getNodeIcon(def).should.eql("theme/icons/fruit-theme/banana.png");
        });

        it("prefixes the api root when one is configured", function() {
            RED.settings.apiRootUrl = "/admin/";
            const def = { type: "inject", category: "function", icon: "arrow-in.svg" };
            RED.utils.getNodeIcon(def).should.eql("/admin/theme/icons/fruit-theme/banana.png");
        });

        it("supports font-awesome icon overrides", function() {
            const def = { type: "banana", category: "fruity", icon: "arrow-in.svg" };
            RED.utils.getNodeIcon(def).should.eql("font-awesome/fa-apple");
        });

        it("keeps an icon set on a node instance ahead of the theme icon", function() {
            const def = { type: "inject", category: "function", icon: "arrow-in.svg" };
            const node = { type: "inject", icon: "font-awesome/fa-star" };
            RED.utils.getNodeIcon(def, node).should.eql("font-awesome/fa-star");
        });

        it("applies the same override in palette and workspace (shared resolution)", function() {
            const def = { type: "inject", category: "function", icon: "arrow-in.svg" };
            RED.utils.getNodeIcon(def).should.eql(RED.utils.getNodeIcon(def, { type: "inject" }));
        });
    });

    describe("caching", function() {
        it("caches color and icon results and clears both on clearNodeColorCache", function() {
            const def = { type: "inject", category: "function", color: "#ffffff", icon: "arrow-in.svg" };
            RED.utils.getNodeColor("inject", def).should.eql("#e4d725");
            RED.utils.getNodeIcon(def).should.eql("theme/icons/fruit-theme/banana.png");

            // Swap the theme rules; cached values must still be returned
            RED.settings.theme = function(property, defaultValue) {
                if (property === "palette.theme") {
                    return [{ type: "inject", color: "#000000", icon: "font-awesome/fa-star" }];
                }
                return defaultValue;
            };
            RED.utils.getNodeColor("inject", def).should.eql("#e4d725");
            RED.utils.getNodeIcon(def).should.eql("theme/icons/fruit-theme/banana.png");

            RED.utils.clearNodeColorCache();
            RED.utils.getNodeColor("inject", def).should.eql("#000000");
            RED.utils.getNodeIcon(def).should.eql("font-awesome/fa-star");
        });
    });
});

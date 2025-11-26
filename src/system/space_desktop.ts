import { renderSpace3 } from "./space/space3_desktop";

(function (): void {
    "use strict";

    kintone.events.on("space.portal.show", function (event) {
        const spaceId = event.spaceId;

        if (spaceId === "3") {
            renderSpace3();
        }

        return event;
    });
})();

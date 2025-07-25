/**
 * Camera integration
 * Source: https://github.com/home-assistant/core/blob/dev/homeassistant/components/camera/__init__.py
 */
import { IncludeList } from "../../types";
import { PlatformSchema } from "../platform";
import { ProxyCameraPlatformSchema } from "./proxy";
export type Domain = "camera";
export type Schema = Item[] | IncludeList;
export type File = Item | Item[];
/**
 * @TJS-additionalProperties true
 */
interface OtherPlatform extends PlatformSchema {
    /**
     * @TJS-pattern ^(?!(mqtt|proxy)$)\w+$
     */
    platform: string;
}
type Item = ProxyCameraPlatformSchema | OtherPlatform;
export {};
//# sourceMappingURL=camera.d.ts.map
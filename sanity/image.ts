import { createImageUrlBuilder } from "@sanity/image-url";
import { client } from "./client";

const { projectId, dataset } = client.config();
const builder = projectId && dataset ? createImageUrlBuilder({ projectId, dataset }) : null;

export function urlFor(source: any) {
  return builder ? builder.image(source) : null;
}

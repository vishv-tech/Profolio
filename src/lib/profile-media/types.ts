export type ProfilePhotoScope = {
  id: string;
  kind: "portfolio" | "resume";
};

export type ProfilePhotoCandidate = {
  height: number;
  pageNumber: number;
  path: string;
  score: number;
  url: string;
  width: number;
};

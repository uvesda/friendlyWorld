import { baseApi } from "@utils/baseApi";

export const puppiesApi = {
  getCount: async () => {
    return baseApi.get("/puppies/");
  }
};
export const sortByTitleBrandDateDesc = (data: any[]) => {
    return [...data].sort((a, b) => new Date(b.titleBrandDate).getTime() - new Date(a.titleBrandDate).getTime());
};

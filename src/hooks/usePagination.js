import { useEffect } from "react";
import { useToast } from "@chakra-ui/react";
import { useCourseSearchingContext } from "components/Providers/CourseSearchingProvider";
import { fetchSearchResult } from "queries/course";
import { useInView } from "react-intersection-observer";

export default function usePagination() {
  const { ref, inView: reachedBottom } = useInView({
    /* Optional options */
    threshold: 0,
  });
  const {
    search,
    searchResult,
    searchColumns,
    totalCount,
    searchSettings,
    searchFiltersEnable,
    searchFilters,
    offset,
    batchSize,
    setSearchLoading,
    setSearchError,
    setOffset,
    setSearchResult,
  } = useCourseSearchingContext();
  const toast = useToast();

  useEffect(() => {
    // console.log('reachedBottom: ',reachedBottom);
    if (reachedBottom && searchResult.length !== 0) {
      // fetch next batch of search results
      if (searchResult.length < totalCount) {
        try {
          setSearchLoading(true);
          fetchSearchResult(
            search,
            searchColumns,
            searchFiltersEnable,
            searchFilters,
            batchSize,
            offset,
            searchSettings.strict_search_mode,
            {
              onSuccess: ({ courses, ...rest }) => {
                setSearchResult([...searchResult, ...courses]);
                setOffset(offset + batchSize);
                setSearchLoading(false);
                setSearchError(null);
              },
            }
          );
        } catch (error) {
          setSearchError(error);
          setSearchLoading(false);
          toast({
            title: "獲取課程資訊失敗",
            description: "請檢查網路連線",
            status: "error",
            duration: 3000,
            isClosable: true,
          });
        }
      }
    }
  }, [reachedBottom]); // eslint-disable-line react-hooks/exhaustive-deps

  return ref;
}

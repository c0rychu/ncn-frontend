import {
  HStack,
  Tag,
  Text,
  ButtonGroup,
  Button,
  Icon,
  Flex,
  Menu,
  MenuItem,
  MenuButton,
  MenuList,
  MenuDivider,
  useToast,
  Stack,
  useColorModeValue,
  Tooltip,
  IconButton,
} from "@chakra-ui/react";
import Image from "next/image";
import CourseDetailInfoContainer from "components/CourseInfo/CourseDetailInfoContainer";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import { CopyToClipboard } from "react-copy-to-clipboard";
import Moment from "moment";
import { IoMdOpen } from "react-icons/io";
import {
  FaPlus,
  FaMinus,
  FaHeartbeat,
  FaHeart,
  FaRegHeart,
} from "react-icons/fa";
import { FiMoreHorizontal } from "react-icons/fi";
import { BiCopy } from "react-icons/bi";
import { getNolAddUrl, getNolUrl } from "utils/getNolUrls";
import openPage from "utils/openPage";
import { useUserData } from "components/Providers/UserProvider";
import { fetchCourse } from "queries/course";
import { useCourseTable } from "components/Providers/CourseTableProvider";
import { fetchCourseTable, patchCourseTable } from "queries/courseTable";
import Head from "next/head";
import { useUser } from "@auth0/nextjs-auth0";
import handleFetch from "utils/CustomFetch";

const LOCAL_STORAGE_KEY = "NTU_CourseNeo_Course_Table_Key";
const copyWordList = [
  { count: 100, word: "複製終結者!!", color: "purple.600", bg: "purple.50" },
  { count: 50, word: "終極複製!!", color: "red.600", bg: "red.50" },
  { count: 25, word: "超級複製!!", color: "orange.600", bg: "orange.50" },
  { count: 10, word: "瘋狂複製!!", color: "yellow.600", bg: "yellow.50" },
  { count: 3, word: "三倍複製!", color: "green.600", bg: "green.50" },
  { count: 2, word: "雙倍複製!", color: "green.600", bg: "green.50" },
  { count: 1, word: "已複製", color: "green.600", bg: "green.50" },
  {
    count: 0,
    word: "複製連結",
  },
];

export async function getServerSideProps({ params }) {
  const { courseId } = params;
  const course = await fetchCourse(courseId);
  return {
    props: {
      code: courseId,
      course,
    },
  };
}

function CourseInfoPage({ code, course }) {
  const bgcolor = useColorModeValue("white", "black");
  const headingColor = useColorModeValue("heading.light", "heading.dark");
  const { setUser, user: userInfo } = useUserData();
  const { setCourseTable } = useCourseTable();
  const router = useRouter();
  const toast = useToast();

  Moment.locale("zh-tw");

  const [addingCourse, setAddingCourse] = useState(false);
  const [addingFavoriteCourse, setAddingFavoriteCourse] = useState(false);
  const [selected, setSelected] = useState(false);
  const { user, isLoading } = useUser();
  const isFavorite = useMemo(
    () => userInfo?.db?.favorites.map((c) => c.id).includes(course.id) ?? false,
    [userInfo, course.id]
  );
  const [copiedLinkClicks, setCopiedLinkClicks] = useState(0);
  const [copyWord, setCopyWord] = useState(
    copyWordList.find((word) => word.count <= copiedLinkClicks)
  );
  const copyBtnDefaultColor = useColorModeValue("gray.700", "gray.100");
  const copyBtnBg = useColorModeValue("white", "gray.800");

  useEffect(() => {
    setCopyWord(copyWordList.find((word) => word.count <= copiedLinkClicks));
  }, [copiedLinkClicks]);

  // get selected & isFavorite init state
  useEffect(() => {
    const getInitState = async () => {
      setAddingCourse(true);
      setAddingFavoriteCourse(true);
      let uuid;
      if (user) {
        // user mode, if no userInfo, log in first
        if (!userInfo) {
          let user_data;
          try {
            user_data = await handleFetch(`/api/user`, {
              user_id: user.sub,
            });
          } catch (e) {
            router.push("/api/auth/login");
          }
          await setUser(user_data);

          if (user_data.db.course_tables.length === 0) {
            uuid = null;
          } else {
            // use the first one
            uuid = user_data.db.course_tables[0];
          }
        } else {
          if (userInfo.db.course_tables.length === 0) {
            uuid = null;
          } else {
            // use the first one
            uuid = userInfo.db.course_tables[0];
          }
        }
      } else {
        // guest mode
        uuid = localStorage.getItem(LOCAL_STORAGE_KEY);
      }
      if (uuid) {
        let courseTable;
        try {
          courseTable = await fetchCourseTable(uuid);
          setCourseTable(courseTable);
        } catch (error) {
          if (
            error?.response?.status === 403 ||
            error?.response?.status === 404
          ) {
            // expired
            setCourseTable(null);
          } else {
            toast({
              title: "取得課表資料失敗",
              status: "error",
              duration: 3000,
              isClosable: true,
            });
          }
          setAddingCourse(false);
          setAddingFavoriteCourse(false);
          return;
        }
        // determine init state
        if (
          courseTable &&
          courseTable.courses.map((c) => c.id).includes(code)
        ) {
          setSelected(true);
        } else {
          setSelected(false);
        }
      }

      setAddingCourse(false);
      setAddingFavoriteCourse(false);
    };

    if (!isLoading) {
      getInitState();
    }
  }, [isLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddCourse = async (course) => {
    if (!isLoading) {
      setAddingCourse(true);

      let uuid;
      if (user) {
        // user mode
        if (userInfo.db.course_tables.length === 0) {
          uuid = null;
        } else {
          // use the first one
          uuid = userInfo.db.course_tables[0];
        }
      } else {
        // guest mode
        uuid = localStorage.getItem(LOCAL_STORAGE_KEY);
      }

      if (uuid) {
        // fetch course table from server
        let courseTable;
        try {
          courseTable = await fetchCourseTable(uuid);
          setCourseTable(courseTable);
        } catch (error) {
          if (
            error?.response?.status === 403 ||
            error?.response?.status === 404
          ) {
            // expired
            setCourseTable(null);
          }
          toast({
            title: "取得課表資料失敗",
            status: "error",
            duration: 3000,
            isClosable: true,
          });
          setAddingCourse(false);
          return;
        }

        if (courseTable === null) {
          // get course_tables/:id return null (expired)
          // show error and break the function
          toast({
            title: `新增 ${course.name} 失敗`,
            description: `您的課表已過期，請重新建立課表`,
            status: "error",
            duration: 3000,
            isClosable: true,
          });
        } else {
          // fetch course table success
          let res_table;
          let operation_str;
          if (courseTable.courses.map((c) => c.id).includes(course.id)) {
            // course is already in course table, remove it.
            operation_str = "刪除";
            const new_courses = courseTable.courses
              .map((c) => c.id)
              .filter((id) => id !== course.id);
            try {
              res_table = await patchCourseTable(
                uuid,
                courseTable.name,
                courseTable.user_id,
                courseTable.expire_ts,
                new_courses
              );
              setCourseTable(res_table);
            } catch (error) {
              if (
                error?.response?.status === 403 ||
                error?.response?.status === 404
              ) {
                // expired
                setCourseTable(null);
              }
              toast({
                title: `刪除 ${course.name} 失敗`,
                status: "error",
                duration: 3000,
                isClosable: true,
              });
              setAddingCourse(false);
              return;
            }
          } else {
            // course is not in course table, add it.
            operation_str = "新增";
            const new_courses = [
              ...courseTable.courses.map((c) => c.id),
              course.id,
            ];
            try {
              res_table = await patchCourseTable(
                uuid,
                courseTable.name,
                courseTable.user_id,
                courseTable.expire_ts,
                new_courses
              );
              setCourseTable(res_table);
            } catch (error) {
              if (
                error?.response?.status === 403 ||
                error?.response?.status === 404
              ) {
                // expired
                setCourseTable(null);
              }
              toast({
                title: `新增 ${course.name} 失敗`,
                status: "error",
                duration: 3000,
                isClosable: true,
              });
              setAddingCourse(false);
              return;
            }
          }
          if (res_table) {
            toast({
              title: `已${operation_str} ${course.name}`,
              description: `課表: ${courseTable.name}`,
              status: "success",
              duration: 3000,
              isClosable: true,
            });
            setSelected(!selected);
          }
          // ELSE TOAST?
        }
      } else {
        // do not have course table id in local storage
        toast({
          title: `新增 ${course.name} 失敗`,
          description: `尚未建立課表`,
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
      setAddingCourse(false);
    }
  };

  const handleAddFavorite = async (course_id) => {
    if (!isLoading) {
      if (user) {
        setAddingFavoriteCourse(true);
        const favorite_list = userInfo.db.favorites.map((c) => c.id);
        try {
          if (favorite_list.includes(course_id)) {
            const updatedFavorite = await handleFetch(
              `/api/user/removeFavoriteCourse`,
              {
                course_id: course_id,
              }
            );
            setUser({
              ...userInfo,
              db: {
                ...userInfo.db,
                favorites: updatedFavorite,
              },
            });
          } else {
            const updatedFavorite = await handleFetch(
              `/api/user/addFavoriteCourse`,
              {
                course_id: course_id,
              }
            );
            setUser({
              ...userInfo,
              db: {
                ...userInfo.db,
                favorites: updatedFavorite,
              },
            });
          }
          setAddingFavoriteCourse(false);
          toast({
            title: `更改最愛課程成功`,
            status: "success",
            duration: 3000,
            isClosable: true,
          });
        } catch (error) {
          toast({
            title: `更改最愛課程失敗`,
            description: `請稍後再試`,
            status: "error",
            duration: 3000,
            isClosable: true,
          });
          setAddingFavoriteCourse(false);
          if (error?.response?.data?.msg === "access_token_expired") {
            router.push("/api/auth/login");
          }
        }
      } else {
        toast({
          title: `請先登入`,
          // description: `請先登入`,
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    }
  };

  if (!course) {
    return (
      <Flex h="95vh" pt="64px" justifyContent="center" alignItems="center">
        <Flex
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
        >
          <HStack>
            <Image
              width={64}
              height={64}
              layout="fixed"
              src={"/img/parrot/ultrafastparrot.gif"}
              alt="Loading Parrot"
            />
          </HStack>
          <Text mt="8" mb="4" fontSize="3xl" fontWeight="600" color="gray.500">
            喔哦! 找不到課程資料
          </Text>
          <HStack>
            <Button
              variant="solid"
              onClick={() =>
                window.open("https://www.surveycake.com/s/LzWd6", "_blank")
              }
            >
              問題回報
            </Button>
            <Button
              variant="solid"
              colorScheme="teal"
              leftIcon={<FaHeartbeat />}
              onClick={() =>
                window.open("https://status.course.myntu.me/", "_blank")
              }
            >
              服務狀態
            </Button>
          </HStack>
        </Flex>
      </Flex>
    );
  } else {
    return (
      <>
        <Head>
          <title>{`${course.name} - 課程資訊 | NTUCourse Neo`}</title>
          <meta
            name="description"
            content={`${course.name} 課程的詳細資訊 | NTUCourse Neo，全新的臺大選課網站。`}
          />
        </Head>
        <Flex
          pt="64px"
          w="100%"
          justifyContent={"center"}
          position={{ base: "fixed", lg: "static" }}
          zIndex={{ base: 100, lg: 0 }}
          bg={bgcolor}
        >
          <HStack
            my="2"
            mx="4%"
            spacing="4"
            w="100%"
            align="center"
            pt={2}
            pb={1}
          >
            <Stack w="100%" direction={{ base: "column", lg: "row" }}>
              <HStack>
                {course.serial ? (
                  <Tag size="md" colorScheme="blue" w="fit-content">
                    <Text fontWeight="800" fontSize={{ base: "md", lg: "lg" }}>
                      {course.serial}
                    </Text>
                  </Tag>
                ) : null}
                <CopyToClipboard
                  text={`${process.env.NEXT_PUBLIC_BASE_URL}/courseinfo/${course.id}`}
                >
                  <Button
                    rightIcon={
                      <Icon
                        as={BiCopy}
                        color={
                          copyWord.count === 0
                            ? copyBtnDefaultColor
                            : copyWord.color
                        }
                      />
                    }
                    variant="ghost"
                    size="xs"
                    bg={copyBtnBg}
                    color={
                      copyWord.count === 0
                        ? copyBtnDefaultColor
                        : copyWord.color
                    }
                    onClick={() => setCopiedLinkClicks(copiedLinkClicks + 1)}
                    display={{ base: "inline-block", lg: "none" }}
                  >
                    {copyWord.word}
                  </Button>
                </CopyToClipboard>
              </HStack>
              <HStack>
                <Tooltip
                  label={course.name}
                  placement="bottom"
                  hasArrow
                  shouldWrapChildren
                  colorScheme="blackAlpha"
                  closeOnClick={false}
                >
                  <Text
                    fontSize={{ base: "xl", lg: "3xl" }}
                    fontWeight="800"
                    color={headingColor}
                    maxW={{ base: "52vw", md: "30vw" }}
                    isTruncated
                    noOfLines={1}
                  >
                    {course.name}
                  </Text>
                </Tooltip>
                <Text
                  fontSize={{ base: "md", lg: "2xl" }}
                  fontWeight="500"
                  color="gray.500"
                >
                  {course.teacher}
                </Text>
              </HStack>
            </Stack>
            <HStack spacing="2" display={{ base: "none", lg: "flex" }}>
              <Tooltip
                label={isFavorite ? "移除最愛" : "加入最愛"}
                placement="bottom"
                hasArrow
              >
                <Button
                  key={"NolContent_Button_" + code + "_addToFavorite"}
                  size="md"
                  colorScheme="red"
                  variant="ghost"
                  isLoading={addingFavoriteCourse}
                  disabled={!userInfo}
                  onClick={() => {
                    handleAddFavorite(course.id);
                  }}
                >
                  <Icon as={isFavorite ? FaHeart : FaRegHeart} boxSize="6" />
                </Button>
              </Tooltip>
              <ButtonGroup isAttached>
                <Button
                  key={"NolContent_Button_" + code + "_addToCourseTable"}
                  mr="-px"
                  size="md"
                  colorScheme={selected ? "red" : "blue"}
                  variant="outline"
                  leftIcon={selected ? <FaMinus /> : <FaPlus />}
                  isLoading={addingCourse || isLoading}
                  onClick={() => {
                    handleAddCourse(course);
                  }}
                >
                  {selected ? "從課表移除" : "加入課表"}
                </Button>
                <Button
                  key={"NolContent_Button_" + code + "_addToNol"}
                  size="md"
                  colorScheme="blue"
                  variant="outline"
                  leftIcon={<FaPlus />}
                  onClick={() => openPage(getNolAddUrl(course), true)}
                >
                  課程網
                </Button>
              </ButtonGroup>
              <Button
                key={"NolContent_Button_" + code + "_OpenNol"}
                size="md"
                rightIcon={<IoMdOpen />}
                onClick={() => window.open(getNolUrl(course), "_blank")}
              >
                課程頁面
              </Button>
              <CopyToClipboard
                text={`${process.env.NEXT_PUBLIC_BASE_URL}/courseinfo/${course.id}`}
              >
                <Button
                  rightIcon={
                    <Icon
                      as={BiCopy}
                      color={
                        copyWord.count === 0
                          ? copyBtnDefaultColor
                          : copyWord.color
                      }
                    />
                  }
                  variant="ghost"
                  size="md"
                  bg={copyBtnBg}
                  color={
                    copyWord.count === 0 ? copyBtnDefaultColor : copyWord.color
                  }
                  onClick={() => setCopiedLinkClicks(copiedLinkClicks + 1)}
                >
                  {copyWord.word}
                </Button>
              </CopyToClipboard>
            </HStack>
            <Menu>
              <MenuButton
                isLoading={addingCourse || isLoading || addingFavoriteCourse}
                as={IconButton}
                variant="ghost"
                icon={<Icon as={FiMoreHorizontal} boxSize="6" />}
                display={{ base: "inline-block", lg: "none" }}
              />
              <MenuList display={{ base: "inline-block", lg: "none" }}>
                <MenuItem
                  key={"NolContent_Button_" + code + "_addToCourseTable"}
                  mr="-px"
                  size="md"
                  color={selected ? "red.500" : "blue.600"}
                  variant="ghost"
                  icon={selected ? <FaMinus /> : <FaPlus />}
                  onClick={() => {
                    handleAddCourse(course);
                  }}
                >
                  {selected ? "從課表移除" : "加入課表"}
                </MenuItem>
                <MenuItem
                  key={"NolContent_Button_" + code + "_addToNol"}
                  size="md"
                  color="blue.600"
                  variant="ghost"
                  icon={<FaPlus />}
                  onClick={() => openPage(getNolAddUrl(course), true)}
                >
                  課程網
                </MenuItem>
                <MenuItem
                  key={"NolContent_Button_" + code + "_addToFavorite"}
                  size="md"
                  color="red.500"
                  variant={"ghost"}
                  icon={isFavorite ? <FaMinus /> : <FaRegHeart />}
                  disabled={!userInfo}
                  onClick={() => {
                    handleAddFavorite(course.id);
                  }}
                >
                  {isFavorite ? "從最愛移除" : "加入最愛"}
                </MenuItem>
                <MenuDivider />
                <MenuItem
                  icon={<IoMdOpen />}
                  onClick={() => window.open(getNolUrl(course), "_blank")}
                >
                  課程頁面
                </MenuItem>
              </MenuList>
            </Menu>
          </HStack>
        </Flex>
        <CourseDetailInfoContainer course={course} />
      </>
    );
  }
}

export default CourseInfoPage;

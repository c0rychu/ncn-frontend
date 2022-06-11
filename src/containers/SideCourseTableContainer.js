import { React, useRef, forwardRef, useEffect, useState } from "react";
import FocusLock from "react-focus-lock";
import {
  Flex,
  Text,
  Box,
  Button,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverArrow,
  PopoverCloseButton,
  PopoverHeader,
  PopoverBody,
  Stack,
  ButtonGroup,
  FormControl,
  FormLabel,
  Input,
  useDisclosure,
  IconButton,
  Spacer,
  useToast,
  Tabs,
  Tab,
  TabList,
  TabPanels,
  TabPanel,
  SkeletonText,
} from "@chakra-ui/react";
import { FaRegEdit, FaRegHandPointDown, FaRegHandPointUp, FaRegMeh, FaPlusSquare, FaAngleDown } from "react-icons/fa";
import CourseTableContainer from "containers/CourseTableContainer";
import { logIn, updateCourseTable } from "actions/index";
import { fetchCourseTableCoursesByIds } from "actions/courses";
import { createCourseTable, fetchCourseTable, patchCourseTable } from "actions/course_tables";
import { linkCoursetableToUser, fetchUserById } from "actions/users";
import { useDispatch, useSelector } from "react-redux";
import { v4 as uuidv4 } from "uuid";
import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate } from "react-router-dom";
import CourseListContainer from "containers/CourseListContainer";
import parseCourseTime from "utils/parseCourseTime";

const LOCAL_STORAGE_KEY = "NTU_CourseNeo_Course_Table_Key";

// eslint-disable-next-line react/display-name
const TextInput = forwardRef((props, ref) => {
  return (
    <FormControl>
      <FormLabel htmlFor={props.id}>{props.label}</FormLabel>
      <Input ref={ref} id={props.id} {...props} />
    </FormControl>
  );
});

function SideCourseTableContainer({ isDisplay, setIsDisplay, setCourseIds, agreeToCreateTableWithoutLogin, setIsLoginWarningOpen }) {
  const navigate = useNavigate();
  const { user, isLoading, isAuthenticated, getAccessTokenSilently } = useAuth0();
  const toast = useToast();
  const dispatch = useDispatch();
  const courseTable = useSelector((state) => state.course_table);
  const userInfo = useSelector((state) => state.user);

  // some local states for handling course data
  // const courseIds = props.courseIds;
  const [courses, setCourses] = useState({}); // dictionary of Course objects using courseId as key
  const [courseTimes, setCourseTimes] = useState({}); // coursesTime is a dictionary of courseIds and their corresponding time in time table

  const [loading, setLoading] = useState(true);
  const [expired, setExpired] = useState(false);

  // will set courseTimes in this function
  const extract_course_info = (courses) => {
    let course_time_tmp = {};
    if (!course_time_tmp.parsed) {
      course_time_tmp.parsed = [];
    }
    if (!course_time_tmp.time_map) {
      course_time_tmp.time_map = {};
    }
    Object.keys(courses).forEach((key) => {
      if (course_time_tmp.parsed.includes(courses[key]._id)) {
        return;
      }
      course_time_tmp = parseCourseTime(courses[key], course_time_tmp);
      course_time_tmp.parsed.push(courses[key]._id);
    });
    // console.log(course_time_tmp);
    return course_time_tmp;
  };

  const convertArrayToObject = (array, key) => {
    const initialValue = {};
    return array.reduce((obj, item) => {
      return {
        ...obj,
        [item[key]]: item,
      };
    }, initialValue);
  };

  // trigger when mounting, fetch local storage course_id
  useEffect(() => {
    const courseTableInit = async (uuid) => {
      let course_table;
      try {
        course_table = await dispatch(fetchCourseTable(uuid));
      } catch (error) {
        // navigate to error page
        navigate(`/error/${error.status_code}`, { state: error });
      }
      if (course_table === null) {
        setExpired(true);
        setLoading(false);
      }
    };

    const fetchCourseTableFromUser = async () => {
      if (!isLoading && user) {
        try {
          const token = await getAccessTokenSilently();
          const user_data = await dispatch(fetchUserById(token, user.sub));
          await dispatch(logIn(user_data));
          const course_tables = user_data.db.course_tables;
          if (course_tables.length === 0) {
            // user has no course table, set courseTable in redux null
            dispatch(updateCourseTable(null));
            setLoading(false);
          } else {
            // pick the first table
            try {
              await dispatch(fetchCourseTable(course_tables[0]));
            } catch (error) {
              navigate(`/error/${error.status_code}`, { state: error });
            }
          }
        } catch (e) {
          toast({
            title: "取得用戶資料失敗.",
            description: "請聯繫客服(?)",
            status: "error",
            duration: 9000,
            isClosable: true,
          });
          setLoading(false);
          // Other subsequent actions?
        }
      }
    };
    // run after useAuth0 finish loading.
    // console.log('isLoading: ', isLoading);
    if (!isLoading) {
      // user mode
      if (user) {
        setLoading(true);
        fetchCourseTableFromUser();
      }
      // guest mode
      else {
        const uuid = localStorage.getItem(LOCAL_STORAGE_KEY);
        // console.log("UUID in localStorage now: ",uuid);
        if (uuid) {
          setLoading(true);
          courseTableInit(uuid);
        } else {
          setLoading(false);
        }
      }
    }
  }, [user, isLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  // fetch course objects data from server based on array of IDs
  useEffect(() => {
    const fetchCoursesDataById = async (_callback) => {
      if (courseTable) {
        // console.log("course_table: ",courseTable);
        try {
          const courseResult = await dispatch(fetchCourseTableCoursesByIds(courseTable.courses));
          // set states: coursesIds, courseTimes, courses
          setCourseIds(courseTable.courses);
          setCourseTimes(extract_course_info(convertArrayToObject(courseResult, "_id")));
          setCourses(convertArrayToObject(courseResult, "_id"));
        } catch (e) {
          toast({
            title: "取得課表課程資料失敗.",
            description: "請聯繫客服(?)",
            status: "error",
            duration: 3000,
            isClosable: true,
          });
        }
      }
      _callback();
    };
    if (courseTable) {
      setLoading(true);
      fetchCoursesDataById(() => setLoading(false));
    }
    // guest mode & do not have uuid on localstorage
    if (!isLoading) {
      // user mode
      if (!user && !localStorage.getItem(LOCAL_STORAGE_KEY)) {
        setLoading(false);
      }
    }
  }, [courseTable]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreateTable = async () => {
    if (!isLoading) {
      // generate a new uuid of course table
      const new_uuid = uuidv4();
      if (user) {
        // hasLogIn
        try {
          await dispatch(createCourseTable(new_uuid, "我的課表", userInfo.db._id, "1102"));
          // console.log("New UUID is generated: ",new_uuid);
          const token = await getAccessTokenSilently();
          await dispatch(linkCoursetableToUser(token, new_uuid, userInfo.db._id));
        } catch (e) {
          toast({
            title: `新增課表失敗`,
            description: `請聯繫客服(?)`,
            status: "error",
            duration: 3000,
            isClosable: true,
          });
        }
      } else {
        // Guest mode
        try {
          const new_course_table = await dispatch(createCourseTable(new_uuid, "我的課表", null, "1102"));
          // console.log("New UUID is generated: ",new_uuid);
          localStorage.setItem(LOCAL_STORAGE_KEY, new_course_table._id);
          setExpired(false);
        } catch (error) {
          toast({
            title: `新增課表失敗`,
            description: `請聯繫客服(?)`,
            status: "error",
            duration: 3000,
            isClosable: true,
          });
        }
      }
    }
  };

  // debugger
  // useEffect(() => console.log('courseTimes: ',courseTimes), [courseTimes]);
  // useEffect(() => console.log('courses: ',courses), [courses]);
  // useEffect(() => console.log('courseIds: ',courseIds), [courseIds]);

  const { onOpen, onClose, isOpen } = useDisclosure();
  const firstFieldRef = useRef(null);
  const handleSave = async () => {
    onClose();
    const new_table_name = firstFieldRef.current.value;
    try {
      const res_table = await dispatch(
        patchCourseTable(courseTable._id, new_table_name, courseTable.user_id, courseTable.expire_ts, courseTable.courses)
      );
      if (res_table) {
        toast({
          title: `變更課表名稱成功`,
          description: `課表名稱已更新為 ${new_table_name}`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else {
        toast({
          title: `變更課表名稱失敗`,
          description: `課表已過期`,
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        setExpired(true);
      }
    } catch (e) {
      toast({
        title: `變更課表名稱失敗`,
        description: `請聯繫客服(?)`,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const renderEditName = () => {
    return (
      <Popover isOpen={isOpen} initialFocusRef={firstFieldRef} onOpen={onOpen} onClose={onClose}>
        <PopoverTrigger>
          <Button size="sm" variant="solid" colorScheme="gray" p="2">
            <FaRegEdit size={22} />
          </Button>
        </PopoverTrigger>
        <Flex zIndex={2000}>
          <PopoverContent>
            <FocusLock returnFocus persistentFocus={false}>
              <PopoverArrow />
              <PopoverCloseButton />
              <PopoverHeader color="gray.500" fontWeight="700">
                課表設定
              </PopoverHeader>
              <PopoverBody p={5}>
                <Stack spacing={4}>
                  <TextInput
                    label="課表名稱"
                    id="table_name"
                    ref={firstFieldRef}
                    defaultValue={courseTable.name}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSave();
                      }
                    }}
                  />
                  <ButtonGroup d="flex" justifyContent="flex-end">
                    <Button variant="outline" onClick={onClose}>
                      Cancel
                    </Button>
                    <Button
                      colorScheme="teal"
                      onClick={() => {
                        handleSave();
                      }}
                    >
                      Save
                    </Button>
                  </ButtonGroup>
                </Stack>
              </PopoverBody>
            </FocusLock>
          </PopoverContent>
        </Flex>
      </Popover>
    );
  };
  const renderSideCourseTableContent = () => {
    if ((courseTable === null || expired === true) && !(loading || isLoading)) {
      return (
        <Flex flexDirection="column" justifyContent="center" alignItems="center" h="100%" w="100%">
          <Flex flexDirection="row" justifyContent="center" alignItems="center">
            <FaRegHandPointUp size="3vh" style={{ color: "gray" }} />
            <FaRegMeh size="3vh" style={{ color: "gray" }} />
            <FaRegHandPointDown size="3vh" style={{ color: "gray" }} />
          </Flex>
          <Text fontSize="2xl" fontWeight="bold" color="gray">
            {expired ? "您的課表已過期" : "尚無課表"}
          </Text>
          <Button
            colorScheme="teal"
            leftIcon={<FaPlusSquare />}
            onClick={() => {
              if (isAuthenticated || agreeToCreateTableWithoutLogin) {
                handleCreateTable();
              } else {
                setIsLoginWarningOpen(true);
              }
            }}
          >
            新增課表
          </Button>
        </Flex>
      );
    }
    return (
      <Box overflow="auto" w="100%" mt={{ base: 0, lg: 4 }}>
        <Flex flexDirection="column">
          <Tabs>
            <Flex flexDirection="row" justifyContent="start" alignItems="center" mb="2" ml="4">
              {courseTable ? (
                <Flex alignItems="center" flexWrap="wrap">
                  <Text fontWeight="700" fontSize={["xl", "2xl", "3xl"]} color="gray.600" mr="4">
                    {courseTable.name}
                  </Text>
                  {renderEditName()}
                  <Spacer mx="8" />
                  <TabList>
                    <Tab>時間表</Tab>
                    <Tab>清單</Tab>
                  </TabList>
                </Flex>
              ) : (
                <SkeletonText width="15vw" mt="2" h="2" noOfLines={3} />
              )}
            </Flex>
            <TabPanels>
              <TabPanel>
                <Flex flexDirection="row" justifyContent="start" alignItems="center" overflowX={"auto"}>
                  <CourseTableContainer courseTimes={courseTimes} courses={courses} loading={loading || isLoading} />
                </Flex>
              </TabPanel>
              <TabPanel>
                <CourseListContainer courseTable={courseTable} courses={courses} loading={loading || isLoading} />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Flex>
      </Box>
    );
  };
  return (
    <Flex flexDirection={{ base: "column", lg: "row" }} h="100%" w="100%">
      <Flex justifyContent="center" alignItems="center">
        <IconButton
          h={{ base: "", lg: "100%" }}
          w={{ base: "100%", lg: "" }}
          icon={
            <Box transform={{ base: "none", lg: "rotate(270deg)" }}>
              <FaAngleDown size={24} />
            </Box>
          }
          onClick={() => {
            setIsDisplay(!isDisplay);
          }}
          size="sm"
          variant="ghost"
        />
      </Flex>
      {renderSideCourseTableContent()}
    </Flex>
  );
}

export default SideCourseTableContainer;

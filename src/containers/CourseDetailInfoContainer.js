import{
  Flex,
  Text,
  Stat,
  StatLabel,
  StatNumber,
  HStack,
  Tab,
  TabList,
  TabPanels,
  TabPanel,
  Tabs,
  Icon,
  useMediaQuery,
  Box,
  Button,
  Tag,
  Image,
  VStack,
  StatHelpText,
  Divider,
  useToast,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverArrow,
  PopoverCloseButton,
  PopoverHeader,
  PopoverBody,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { PieChart } from 'react-minimal-pie-chart';
import { FaCircle, FaRss, FaExclamationTriangle, FaQuestionCircle } from 'react-icons/fa';
import { IoMdOpen } from 'react-icons/io';
import BetaBadge from '../components/BetaBadge';
import { info_view_map } from '../data/mapping_table';
import PTTContentRowContainer from './PTTContentRowContainer';
import { getCourseEnrollInfo, getNTURatingData, getPTTData, getCourseSyllabusData } from '../actions/index';
import { useDispatch } from 'react-redux';
import ParrotGif from "../img/parrot/parrot.gif";
import { hash_to_color_hex_with_hue } from '../utils/colorAgent';

const syllabusTitle = {
  intro: "概述",
  objective: "目標",
  requirement: "要求",
  office_hour: "Office Hour",
  material: "參考書目",
  specify: "指定閱讀"
}

function CourseDetailInfoContainer({ course }){
  const toast = useToast();
  const dispatch = useDispatch();
  const [isMobile] = useMediaQuery('(max-width: 1000px)')

  // Course live data
  const [ CourseEnrollStatus, setCourseEnrollStatus ] = useState(null);
  const [ NTURatingData, setNTURatingData ] = useState(null);
  const [ PTTReviewData, setPTTReviewData ] = useState(null);
  const [ PTTExamData, setPTTExamData ] = useState(null);
  const [ SyllubusData, setSyllubusData ] = useState(null);

  // Live data loading states
  const [ isLoadingEnrollInfo, setIsLoadingEnrollInfo ] = useState(true);
  const [ isLoadingRatingData, setIsLoadingRatingData ] = useState(true);
  const [ isLoadingPTTReviewData, setIsLoadingPTTReviewData ] = useState(true);
  const [ isLoadingPTTExamData, setIsLoadingPTTExamData ] = useState(true);
  const [ isLoadingSyllubusData, setIsLoadingSyllubusData ] = useState(true);


  async function fetchCourseEnrollData() {
    setIsLoadingEnrollInfo(true);
    let data;
    try {
        data = await dispatch(getCourseEnrollInfo(course.id));
    } catch (error) {
        setIsLoadingEnrollInfo(false);
        toast({
            title: "錯誤",
            description: "無法取得課程即時資訊",
            status: "error",
            duration: 3000,
            isClosable: true,
        });
        return;
    }
    setCourseEnrollStatus(data);
    setIsLoadingEnrollInfo(false);
  }
  async function fetchNTURatingData() {
    setIsLoadingRatingData(true);
    let data;
    try {
        data = await dispatch(getNTURatingData(course._id));
    } catch (error) {
        setIsLoadingRatingData(false);
        toast({
            title: "無法取得 NTURating 評價資訊",
            description: "請洽 rating.myntu.me",
            status: "error",
            duration: 3000,
            isClosable: true,
        });
        return;
    }
    setNTURatingData(data);
    setIsLoadingRatingData(false);
  }
  async function fetchPTTReviewData() {
    setIsLoadingPTTReviewData(true);
    let data;
    try {
        data = await dispatch(getPTTData(course._id, "review"));
    } catch (error) {
        setIsLoadingPTTReviewData(false);
        toast({
            title: "無法取得 PTT 貼文資訊",
            description: "請洽 ptt.cc",
            status: "error",
            duration: 3000,
            isClosable: true,
        });
        return;
    }
    setPTTReviewData(data);
    setIsLoadingPTTReviewData(false);
  }
  async function fetchPTTExamData() {
    setIsLoadingPTTExamData(true);
    let data;
    try {
        data = await dispatch(getPTTData(course._id, "exam"));
    } catch (error) {
        setIsLoadingPTTExamData(false);
        toast({
            title: "無法取得 PTT 貼文資訊",
            description: "請洽 ptt.cc",
            status: "error",
            duration: 3000,
            isClosable: true,
        });
        return;
    }
    setPTTExamData(data);
    setIsLoadingPTTExamData(false);
  }
  async function fetchSyllabusData() {
    setIsLoadingSyllubusData(true);
    let data;
    try {
        data = await dispatch(getCourseSyllabusData(course._id));
    } catch (error) {
        setIsLoadingSyllubusData(false);
        toast({
            title: "無法取得課程大綱資訊",
            description: "請洽台大課程網",
            status: "error",
            duration: 3000,
            isClosable: true,
        });
        return;
    }
    if(data && data.grade){
      data.grade.forEach(grade => {
        grade.color = hash_to_color_hex_with_hue(grade.title, {min: 180, max: 200});
      })
    }
    setSyllubusData(data);
    setIsLoadingSyllubusData(false);
  }
  
  useEffect(() => {
    fetchNTURatingData();
    fetchCourseEnrollData();
    fetchPTTReviewData();
    fetchPTTExamData();
    fetchSyllabusData();
} ,[]); // eslint-disable-line react-hooks/exhaustive-deps

  const course_codes_1 = [
    {title: "流水號", value: course.id},
    {title: "課號", value: course.course_code},
    {title: "課程識別碼", value: course.course_id},
    {title: "班次", value: course.class_id ? course.class_id : "無"},
  ];
  const course_codes_2 = [
    {title: "人數上限", value: course.total_slot},
    {title: "必選修", value: info_view_map.required.map[course.required]},
    {title: "開課學期", value: course.semester},
    {title: "授課語言", value: info_view_map.language.map[course.language]},
  ];
  const renderDataSource = (dataSource) => {
    return(
      <HStack spacing="2">
        <FaRss color="gray" size="12"/>
        <Text fontSize="sm" textAlign="center" color="gray.500">資料來源: {dataSource}</Text>
      </HStack>
    );
  }
  const renderPanelLoaing = (title="努力取得資訊中...", height, pt="0") => {
    return(
      <Flex w="100%" h={height} pt={pt} flexDirection="column" justifyContent="center" alignItems="center">
        <VStack>
          <Image src={ParrotGif} h="32px" />
          <Text fontSize="lg" fontWeight="800" color="gray.500" textAlign="center">{title}</Text>
        </VStack>
      </Flex>
    );
  };
  const renderFallback = (title="暫無資訊", type="empty", height, pt="0") => {
    return(
      <Flex w="100%" h={height} pt={pt} flexDirection="column" justifyContent="center" alignItems="center">
        <Icon as={type==="empty" ? FaQuestionCircle : FaExclamationTriangle} boxSize="32px" color="gray.500" />
        <Text mt="2" fontSize="lg" fontWeight="800" color="gray.500" textAlign="center">{title}</Text>
      </Flex>
    );
  };
  const renderCourseEnrollPanel = () => {
    if(isLoadingEnrollInfo){
      return(
        renderPanelLoaing("努力取得資訊中...", "100%", "8")
      );
    };
    if(!CourseEnrollStatus){
      return renderFallback("無法取得課程即時資訊", {FaExclamationTriangle}, "100%", "8");
    }
    return(
      <Flex w="100%" mt="4" flexDirection="row" justifyContent="center" alignItems={isMobile? "start":"center"} flexWrap="wrap">
        <Stat>
          <StatLabel>選上</StatLabel>
          <StatNumber>{CourseEnrollStatus.enrolled}</StatNumber>
          <StatHelpText>人</StatHelpText>
        </Stat>
        <Stat>
          <StatLabel>選上外系</StatLabel>
          <StatNumber>{CourseEnrollStatus.enrolled_other}</StatNumber>
          <StatHelpText>人</StatHelpText>
        </Stat>
        <Stat>
          <StatLabel>登記</StatLabel>
          <StatNumber>{CourseEnrollStatus.registered}</StatNumber>
          <StatHelpText>人</StatHelpText>
        </Stat>
        <Stat>
          <StatLabel>剩餘</StatLabel>
          <StatNumber>{CourseEnrollStatus.remain}</StatNumber>
          <StatHelpText>空位</StatHelpText>
        </Stat>
      </Flex>
    );
  }
  const renderNTURatingPanel = () => {
    if(isLoadingRatingData){
      return(
        renderPanelLoaing("查詢評價中...", "100%", "8")
      );
    };
    if(!NTURatingData){
      return renderFallback("無評價資訊", "empty", "100%", "8");
    }
    return(
      <Flex h="100%" flexDirection="column" alignItems="start">
        <Text fontSize="md" fontWeight="600" color="gray.700">NTURating 上共有 {NTURatingData.count} 筆評價</Text>
        <HStack w="100%" justify="space-between" my="2">
          <Stat>
            <StatLabel>甜度</StatLabel>
            <StatNumber>{NTURatingData.sweety}</StatNumber>
            <StatHelpText>平均值</StatHelpText>
          </Stat>
          <Stat>
            <StatLabel>涼度</StatLabel>
            <StatNumber>{NTURatingData.breeze}</StatNumber>
            <StatHelpText>平均值</StatHelpText>
          </Stat>
          <Stat>
            <StatLabel>紮實度</StatLabel>
            <StatNumber>{NTURatingData.workload}</StatNumber>
            <StatHelpText>平均值</StatHelpText>
          </Stat>
          <Stat>
            <StatLabel>品質</StatLabel>
            <StatNumber>{NTURatingData.quality}</StatNumber>
            <StatHelpText>平均值</StatHelpText>
          </Stat>
        </HStack>
        <Button colorScheme="blue" variant="outline" size="sm" rightIcon={<IoMdOpen/>} onClick={() => window.open(NTURatingData.url+"?referrer=ntucourse_neo", "_blank")}>前往 NTURating 查看該課程評價</Button>
      </Flex>
    );
  }
  const renderPTTReviewPanel = () => {
    if(isLoadingPTTReviewData){
      return(
        renderPanelLoaing("努力爬文中...", "100%", "8")
      );
    };
    if(!PTTReviewData){
      return renderFallback("無相關貼文資訊", "empty", "100%", "8");
    }
    return(
      <PTTContentRowContainer info={PTTReviewData} height="14vh"/>
    );
  };
  const renderPTTExamPanel = () => {
    if(isLoadingPTTExamData){
      return(
        renderPanelLoaing("努力爬文中...", "100%", "8")
      );
    };
    if(!PTTExamData){
      return renderFallback("無相關貼文資訊", "empty", "100%", "8");
    }
    return(
      <PTTContentRowContainer info={PTTExamData} height="25vh"/>
    );
  };
  const renderSyllabusDataPanel = () => {
    if(isLoadingSyllubusData){
      return(
        renderPanelLoaing("載入中...", "100%", "8")
      );
    };
    if(!SyllubusData){
      return renderFallback("無課程大綱資訊", "empty", "100%", "8");
    }
    return(
      <Flex w="100%" my="4" flexDirection="column" justifyContent="start" alignItems="start" wordBreak="break-all" overflow="auto">
        {
          Object.keys(SyllubusData.syllabus).map((key, index) => {
            let line = SyllubusData.syllabus[key].split('\n');
            const content = line.map((item, index) => {
              return(
                <Text mb="0.5" fontSize="md" fontWeight="400" color="gray.600">{item.trim()}</Text>
              );
            })

            return(
              <>
                <Text fontSize="lg" fontWeight="600" color="gray.700">{syllabusTitle[key]}</Text>
                {SyllubusData.syllabus[key] !== ""? content : <Text fontSize="md" fontWeight="400" color="gray.600">無</Text>}
              </>
            );
          })
        }
      </Flex>
    );
  };
  const renderGradePolicyPanel = () => {
    if(isLoadingSyllubusData){
      return(
        renderPanelLoaing("查看配分中...", "100%", "8")
      );
    };
    if(!SyllubusData || !SyllubusData.grade){
      return renderFallback("無評分相關資訊", "empty", "100%", "8");
    }
    return(
      <Flex my="4" flexDirection={isMobile ? "column":"row"} justifyContent="space-evenly" alignItems="center">
        <Box w="200px" h="200px">
          <PieChart
            lineWidth={50}
            label={({ dataEntry }) => dataEntry.value+"%"}
            labelPosition={75}
            data={SyllubusData.grade}
            labelStyle={(index) => ({
              fill: "white",
              fontSize: '10px',
              fontFamily: 'sans-serif',
            })}/>
        </Box>
        <VStack mt={isMobile ? "4":""} align="start">
          {SyllubusData.grade.map((item, index) => {
            let line = item.comment.split('\n');
            const content = line.map((item, index) => {
              return(
                <Text mb="1" fontSize="md" fontWeight="400" color="gray.700">{item.trim()}</Text>
              );
            })
            return(
              <>
                <Popover>
                  <PopoverTrigger>
                    <HStack justify="start" cursor="pointer">
                      <Icon as={FaCircle} size="20px" color={item.color}/>
                      <Text fontSize="lg" fontWeight="800" color={item.color}>{item.value}%</Text>
                      <Text fontSize="md" fontWeight="600" color="gray.700">{item.title}</Text>
                    </HStack>
                  </PopoverTrigger>
                  <PopoverContent>
                    <PopoverArrow />
                    <PopoverCloseButton />
                    <PopoverHeader>
                      <HStack>
                        <Text fontSize="lg" fontWeight="800" color={item.color}>{item.value}%</Text>
                        <Text fontSize="md" fontWeight="600" color="gray.700">{item.title}</Text>
                      </HStack>
                    </PopoverHeader>
                    <PopoverBody>
                      {
                      }
                      <Text fontSize="md" fontWeight="400" color="gray.700">{item.comment === "" ? "無詳細資訊" : content}</Text>
                    </PopoverBody>
                  </PopoverContent>
                </Popover>
              </>
            );
          })}
        </VStack>
      </Flex>
    );
  };
  return(
    <Flex w="100%" minH="83vh" pt={isMobile ? "150px":""} flexDirection={isMobile?'column':'row'} flexWrap="wrap" justify={'center'}>
      {/* COL 1 */}
      <Flex w={isMobile?"100%": "30%"} flexDirection={'column'}>
        {/* Box1 */}
        <Flex bg='gray.100' h="60vh" my='1vh' px="6" py="4" borderRadius='xl' flexDirection="column">
          <Text fontSize="2xl" fontWeight="800" color="gray.700">詳細資料</Text>
          <Flex mt="4" justifyContent="start" alignItems="start" flexWrap='wrap' gap="2">
            <Flex mr="16" flexDirection="column" flexWrap="wrap">
              {
                course_codes_1.map((item, index) => {
                  return(
                    <Stat key={"code_stats_"+index}>
                      <StatLabel>{item.title}</StatLabel>
                      <StatNumber>{item.value}</StatNumber>
                    </Stat>
                  );
                })
              }
            </Flex>
            <Flex mr="16" flexDirection="column" flexWrap="wrap">
              {
                course_codes_2.map((item, index) => {
                  return(
                    <Stat key={"code_stats_"+index}>
                      <StatLabel>{item.title}</StatLabel>
                      <StatNumber>{item.value}</StatNumber>
                    </Stat>
                  );
                })
              }
            </Flex>
            <Flex flexDirection="column" flexWrap="wrap">
              <Stat>
                <StatLabel>系所</StatLabel>
                <StatNumber>
                  <HStack spacing="2">
                    {
                      course.department === "" ? "無":
                      course.department.map((item, index) => {
                        return(
                          <Tag key={"department_"+index} colorScheme="blue" size="lg">{item}</Tag>
                          );
                        })
                    }
                  </HStack>
                </StatNumber>
              </Stat>
              <Stat>
                <StatLabel>學分</StatLabel>
                <StatNumber>{course.credit}</StatNumber>
              </Stat>
              <Stat>
                <StatLabel>加簽方式</StatLabel>
                <StatNumber>
                  <HStack spacing="2">
                    <Tag colorScheme="blue" size="lg" fontWeight="800" fontSize="xl">{course.enroll_method}</Tag>
                    <Text>{info_view_map.enroll_method.map[course.enroll_method]}</Text>
                  </HStack>
                </StatNumber>
              </Stat>
              <Stat>
                <StatLabel>開課單位</StatLabel>
                <StatNumber>{course.provider.toUpperCase()}</StatNumber>
              </Stat>
            </Flex>
          </Flex>
          <Divider mt="4" mb="4" borderColor="gray.300"/>
          <VStack mt="2" align="start">
            <Text fontSize="md" textAlign="center" color="gray.700" fontWeight="700">修課限制</Text>
            <Text fontSize="sm" textAlign="center" color="gray.600">{course.limit}</Text>
          </VStack>
          <VStack mt="2" align="start">
            <Text fontSize="md" textAlign="center" color="gray.700" fontWeight="700">備註</Text>
            <Text fontSize="sm" textAlign="center" color="gray.600">{course.note}</Text>
          </VStack>
          <Divider mt="4" mb="4" borderColor="gray.300"/>
          <Text fontSize="lg" color="gray.700" fontWeight="700">節次資訊</Text>
          <Text fontSize="sm" color="gray.600">{course.time_loc}</Text>
        </Flex>
        {/* Box2 */}
        <Flex bg='gray.100' h={isMobile? "":"26vh"} my='1vh' px="6" py="4" borderRadius='xl' flexDirection="column" justifyContent="space-between">
          <Tabs variant='soft-rounded' size="sm">
            <HStack spacing="4">
              <Text fontSize="2xl" fontWeight="800" color="gray.700">選課資訊</Text>
              <TabList>
                <Tab><Icon mr="2" w="2" as={FaCircle} color="red.600"/>即時</Tab>
                <Tab isDisabled cursor="not-allowed">歷史<BetaBadge content="coming soon" size="xs"/></Tab>
              </TabList>
            </HStack>
            <TabPanels>
              <TabPanel>
                {renderCourseEnrollPanel()}
              </TabPanel>
              <TabPanel>
                <p>two!</p>
              </TabPanel>
            </TabPanels>
          </Tabs>        
            {renderDataSource("臺大選課系統")}
        </Flex>
      </Flex>
      {/* COL 2 */}
      <Flex w={isMobile?"100%": "30%"} mx={isMobile? "":"1%"} flexDirection={'column'}>
        {/* Box3 */}
        <Flex h={isMobile? "":"20vh"} bg='gray.100' my='1vh' px="6" py="4" borderRadius='xl' flexDirection="column">
          <Text fontSize="2xl" fontWeight="800" color="gray.700">加簽資訊<BetaBadge content="coming soon" size="sm"/></Text>
        </Flex>
        {/* Box4 */}
        <Flex h={isMobile? "":"30vh"} bg='gray.100' my='1vh' px="6" py="4" borderRadius='xl' flexDirection="column" justifyContent="space-between">
          <Tabs h="100%" variant='soft-rounded' size="sm">
            <HStack spacing="4">
              <Text fontSize="2xl" fontWeight="800" color="gray.700">評價<BetaBadge content="preview" size="sm"/></Text>
              <TabList>
                <Tab>PTT</Tab>
                <Tab>NTURating</Tab>
              </TabList>
            </HStack>
            <TabPanels>
              <TabPanel>
                {renderPTTReviewPanel()}
              </TabPanel>
              <TabPanel>
                {renderNTURatingPanel()}
              </TabPanel>
            </TabPanels>
          </Tabs>
          {renderDataSource("PTT NTUCourse, NTURating")}
        </Flex>
        {/* Box5 */}
        <Flex h={isMobile? "":"34vh"} bg='gray.100' my='1vh' px="6" py="4" borderRadius='xl' flexDirection="column" justifyContent="space-between">
          <Tabs variant='soft-rounded' size="sm">
            <HStack spacing="4">
              <Text fontSize="2xl" fontWeight="800" color="gray.700">考古題資訊<BetaBadge content="preview" size="sm"/></Text>
              <TabList>
                <Tab>PTT</Tab>
              </TabList>
            </HStack>
            <TabPanels>
              <TabPanel>
                  {renderPTTExamPanel()}
              </TabPanel>
            </TabPanels>
          </Tabs>
          {renderDataSource("PTT NTU-Exam")}
        </Flex>
      </Flex>
      {/* COL 3 */}
      <Flex w={isMobile?"100%": "30%"} flexDirection={'column'}>
        {/* Box6 */}
        <Flex bg='gray.100' h={isMobile? '':'55vh'} my='1vh' px="6" py="4" borderRadius='xl' flexDirection="column" justifyContent="space-between">
          <VStack h="95%" align="start">
            <Text fontSize="2xl" fontWeight="800" color="gray.700">課程大綱</Text>
            {renderSyllabusDataPanel()}
          </VStack>
          {renderDataSource("臺大課程網")}
        </Flex>
        {/* Box7 */}
        <Flex h={isMobile? "":"31vh"} bg='gray.100' my='1vh' px="6" py="4" borderRadius='xl' flexDirection="column" justifyContent="space-between">
          <Text fontSize="2xl" fontWeight="800" color="gray.700">評分方式</Text>
          {renderGradePolicyPanel()}
          {renderDataSource("臺大課程網")}
        </Flex>
      </Flex>
    </Flex>
  );
}

export default CourseDetailInfoContainer;
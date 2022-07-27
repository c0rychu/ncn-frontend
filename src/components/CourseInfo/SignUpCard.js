import {
  Flex,
  Stat,
  StatLabel,
  StatNumber,
  Text,
  VStack,
  HStack,
  Tooltip,
  Spacer,
  Icon,
  Badge,
  Button,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverArrow,
  PopoverCloseButton,
  ButtonGroup,
  Textarea,
  useToast,
  useDisclosure,
  useColorModeValue,
} from "@chakra-ui/react";
import { useState } from "react";
import {
  FaThumbsUp,
  FaThumbsDown,
  FaInfoCircle,
  FaClock,
} from "react-icons/fa";
import { social_user_type_map } from "data/mapping_table";
import Moment from "moment";
import handleFetch from "utils/CustomFetch";
import { useRouter } from "next/router";
import { reportEvent } from "utils/ga";

// prop.post
// {
//   _id: post._id,
//   course_id: post.course_id,
//   type: post.type,
//   content: post.content,
//   is_owner: post.user_id === user_id,
//   user_type: post.user_type,
//   create_ts: post.create_ts,
//   upvotes: post.upvotes.length,
//   downvotes: post.downvotes.length,
//   self_vote_status: get_self_vote_status(post, user_id)
// }

function SignUpCard({
  post,
  SignUpPostData,
  setSignUpPostData,
  fetchSignUpPostData,
}) {
  const is_owner = post.is_owner;
  const toast = useToast();
  const [isVotingPost, setIsVotingPost] = useState(0);
  const [isDeletingPost, setIsDeletingPost] = useState(false);
  const [isReportingPost, setIsReportingPost] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const { onOpen, onClose, isOpen } = useDisclosure();
  const router = useRouter();
  Moment.locale("zh-tw");

  const handleRefetchPost = async (post_id) => {
    let data;
    try {
      data = await handleFetch("/api/social/getByPostId", {
        post_id,
      });
    } catch (error) {
      toast({
        title: "無法處理評分",
        description: "請稍後再試一次",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      if (error?.response?.data?.msg === "access_token_expired") {
        router.push("/api/auth/login");
      }
      return;
    }
    // find the post in the SignUpPostData array and replace it with the new data.
    const new_post = data;
    const new_post_index = SignUpPostData.findIndex(
      (post) => post._id === post_id
    );
    const new_post_array = [...SignUpPostData];
    new_post_array[new_post_index] = new_post;
    setSignUpPostData(new_post_array);
  };

  const handleVotePost = async (post_id, vote_type) => {
    setIsVotingPost(vote_type);
    try {
      console.log("vote_type: ", vote_type);
      await handleFetch("/api/social/votePost", { post_id, vote_type });
    } catch (error) {
      setIsVotingPost(0);
      toast({
        title: "無法處理評分",
        description: "請稍後再試。",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      if (error?.response?.data?.msg === "access_token_expired") {
        router.push("/api/auth/login");
      }
      return;
    }
    handleRefetchPost(post_id);
    setIsVotingPost(0);
  };

  const handleDeletePost = async (post_id) => {
    setIsDeletingPost(true);
    try {
      await handleFetch("/api/social/deletePost", { post_id });
    } catch (error) {
      setIsDeletingPost(false);
      toast({
        title: "無法處理刪除貼文",
        description: "請稍後再試。",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      if (error?.response?.data?.msg === "access_token_expired") {
        router.push("/api/auth/login");
      }
      return;
    }
    setIsDeletingPost(false);
    fetchSignUpPostData();
  };

  const handleReportPost = async (post_id, content) => {
    setIsReportingPost(true);
    try {
      await handleFetch("/api/social/reportPost", { post_id, content });
    } catch (error) {
      setIsReportingPost(false);
      toast({
        title: "檢舉貼文失敗",
        description: "您可能已檢舉過此貼文，或請稍後再試一次。",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      if (error?.response?.data?.msg === "access_token_expired") {
        router.push("/api/auth/login");
      }
      return;
    }
    setIsReportingPost(false);
    fetchSignUpPostData();
  };

  const renderReportPopover = () => {
    return (
      <Popover
        placement="bottom"
        isOpen={isOpen}
        onOpen={onOpen}
        onClose={onClose}
      >
        <PopoverTrigger>
          <Button
            colorScheme="red"
            variant="ghost"
            size="sm"
            isDisabled={is_owner}
            isLoading={isReportingPost}
          >
            檢舉
          </Button>
        </PopoverTrigger>
        <PopoverContent>
          <PopoverArrow />
          <PopoverCloseButton />
          <Flex p="4" flexDirection="column" alignItems="start">
            <Text
              fontSize="md"
              fontWeight="800"
              color="gray.700"
              textAlign="center"
            >
              檢舉此資訊
            </Text>
            <Textarea
              my="2"
              size="md"
              placeholder="請輸入檢舉原因"
              onChange={(e) => {
                setReportReason(e.currentTarget.value);
              }}
            />
            <ButtonGroup w="100%" size="sm" d="flex" justifyContent="end">
              <Button
                colorScheme="red"
                onClick={() => {
                  handleReportPost(post._id, reportReason);
                  reportEvent("signup_post", "click", "report_post");
                  onClose();
                }}
                isDisabled={reportReason === ""}
              >
                檢舉
              </Button>
            </ButtonGroup>
          </Flex>
        </PopoverContent>
      </Popover>
    );
  };

  return (
    <Flex
      key={post._id}
      w="100%"
      h="75%"
      py="8"
      px="8"
      justifyContent="space-around"
      alignItems="start"
      flexDirection={{ base: "column", md: "row" }}
      bg={useColorModeValue("gray.200", "gray.700")}
      borderRadius="lg"
      boxShadow="lg"
    >
      <Flex
        h="100%"
        w={{ base: "100%", md: "24" }}
        flexWrap="wrap"
        alignItems="start"
      >
        <Stat minW="16">
          <StatLabel>加簽人數</StatLabel>
          <StatNumber>{post.content.amount}</StatNumber>
        </Stat>
        <Stat minW="16">
          <StatLabel>加簽方式</StatLabel>
          <Text mt="1" fontSize="lg" fontWeight="600">
            {post.content.rule}
          </Text>
        </Stat>
        <Stat minW="16">
          <StatLabel>加簽日期</StatLabel>
          <Text mt="1" fontSize="lg" fontWeight="600">
            {post.content.when}
          </Text>
        </Stat>
      </Flex>
      <VStack mt={{ base: 4, md: 0 }} w={{ base: "100%", md: "70%" }} h="100%">
        <VStack w="100%" h="100%" justify="start" align="start">
          <HStack w="100%">
            <Text
              fontSize="sm"
              fontWeight="600"
              color={useColorModeValue("gray.800", "gray.300")}
            >
              更多資訊
            </Text>
            <Tooltip
              label="此資訊基於社群回報取得資訊，可能有缺漏或不完全正確，亦不代表本站立場，請確實做好事實查證。"
              placement="top"
              hasArrow
            >
              <p>
                <Icon as={FaInfoCircle} boxSize="3" color="gray.500" />
              </p>
            </Tooltip>
            <Spacer />
            <Text fontSize="xs" fontWeight="600" color="gray.500">
              提供者
            </Text>
            <Badge colorScheme="blue">
              {is_owner ? "我" : social_user_type_map[post.user_type]}
            </Badge>
            {is_owner ? (
              <Button
                size="sm"
                h="100%"
                variant={"ghost"}
                colorScheme="gray"
                fontSize={"sm"}
                color="red.600"
                onClick={() => {
                  handleDeletePost(post._id);
                  reportEvent("signup_post", "click", "delete_self_post");
                }}
                isLoading={isDeletingPost}
              >
                刪除
              </Button>
            ) : (
              <></>
            )}
          </HStack>
          <Flex h={{ base: "150px", md: "150px" }} overflow="auto" flexGrow={1}>
            <Text
              fontSize="md"
              fontWeight="600"
              color={useColorModeValue("gray.600", "gray.400")}
              overflow="auto"
              wordBreak="break-all"
            >
              {post.content.comment === "" ? "無" : post.content.comment}
            </Text>
          </Flex>
        </VStack>
        <HStack w="100%" justify="start">
          <HStack>
            <Icon as={FaClock} boxSize="3" color="gray.500" />
            <Text fontSize="xs" fontWeight="500" color="gray.500">
              {Moment(post.create_ts).format("YYYY-MM-DD HH:mm")}
            </Text>
          </HStack>
          <Spacer />
          <Button
            colorScheme="teal"
            variant={post.self_vote_status === 1 ? "solid" : "ghost"}
            size="xs"
            leftIcon={<FaThumbsUp />}
            isLoading={isVotingPost === 1}
            onClick={() => {
              handleVotePost(post._id, post.self_vote_status === 1 ? 0 : 1);
              reportEvent("signup_post", "click", "vote_post_up");
            }}
          >
            {post.upvotes}
          </Button>
          <Button
            colorScheme={useColorModeValue("orange", "red")}
            variant={post.self_vote_status === -1 ? "solid" : "ghost"}
            size="xs"
            leftIcon={<FaThumbsDown />}
            isLoading={isVotingPost === -1}
            onClick={() => {
              handleVotePost(post._id, post.self_vote_status === -1 ? 0 : -1);
              reportEvent("signup_post", "click", "vote_post_down");
            }}
          >
            {post.downvotes}
          </Button>
          {renderReportPopover()}
        </HStack>
      </VStack>
    </Flex>
  );
}

export default SignUpCard;

# NVIDIA

# Create a chat completion

POST

[https://integrate.api.nvidia.com/v1/chat/completions](https://integrate.api.nvidia.com/v1/chat/completions)

Given a list of messages comprising a conversation, the model will return a response. Compatible with OpenAI. See ++[https://platform.openai.com/docs/api-reference/chat/create](https://platform.openai.com/docs/api-reference/chat/create)++

Recent Requests

Log in to see full request history


| TIME                           | STATUS | USER AGENT |     |
| ------------------------------ | ------ | ---------- | --- |
| Make a request to see history. |        |            |     |


0 Requests This Month





Body Params



OpenAI ChatCompletionRequest



model

string

Defaults to mistralai/mistral-large

max_tokens

integer

≥ 1

Defaults to 1024

The maximum number of tokens to generate in any given call. Note that the model is not aware of this value, and generation will simply stop at the number of tokens specified.

stream

boolean

Defaults to false

If set, partial message deltas will be sent. Tokens will be sent as data-only server-sent events (SSE) as they become available (JSON responses are prefixed by `data:` ), with the stream terminated by a `data: [DONE]` message.

truefalse

temperature

number

0 to 1

Defaults to 0.5

The sampling temperature to use for text generation. The higher the temperature value is, the less deterministic the output text will be. It is not recommended to modify both temperature and top_p in the same call.

top_p

number

0 to 1

Defaults to 1

The top-p sampling mass used for text generation. The top-p value determines the probability mass that is sampled at sampling time. For example, if top_p = 0.2, only the most likely tokens (summing to 0.2 cumulative probability) will be sampled. It is not recommended to modify both temperature and top_p in the same call.

stop

A string or a list of strings where the API will stop generating further tokens. The returned text will not contain the stop sequence.

arraystringnull

STOP ARRAY OF STRINGS

frequency_penalty

number

-2 to 2

Defaults to 0

Indicates how much to penalize new tokens based on their existing frequency in the text so far, decreasing model likelihood to repeat the same line verbatim.

presence_penalty

number

-2 to 2

Defaults to 0

Positive values penalize new tokens based on whether they appear in the text so far, increasing model likelihood to talk about new topics.

seed

integer

Defaults to 0

The model generates random results. Changing the input seed alone will produce a different response with similar characteristics. It is possible to reproduce results by fixing the input seed (assuming all other hyperparameters are also fixed).

messagesstringarray

required

A list of messages comprising the conversation so far.

Responses

# 200

Successful Response

# 402

Payment Required

# 422

Validation Error

**Updated almost 2 years ago**

---

[mistralai / mistral-large](https://docs.api.nvidia.com/nim/reference/mistralai-mistral-large)

[mistralai / mistral-nemotron](https://docs.api.nvidia.com/nim/reference/mistralai-mistral-nemotron)

Did this page help you?

LANGUAGE

**ShellNodePython**

CREDENTIALS

BEARER

REQUEST

```

```

```

```

1

```
import requests
```

2

```
​
```

3

```
url = "https://integrate.api.nvidia.com/v1/chat/completions"
```

4

```
​
```

5

```
payload = {
```

6

```
    "model": "mistralai/mistral-large",
```

7

```
    "max_tokens": 1024,
```

8

```
    "stream": False,
```

9

```
    "temperature": 0.5,
```

10

```
    "top_p": 1,
```

11

```
    "frequency_penalty": 0,
```

12

```
    "presence_penalty": 0,
```

13

```
    "seed": 0
```

14

```
}
```

15

```
headers = {
```

16

```
    "accept": "application/json",
```

17

```
    "content-type": "application/json"
```

18

```
}
```

19

```
​
```

20

```
response = requests.post(url, json=payload, headers=headers)
```

21

```
​
```

22

```
print(response.text)
```

Try It!

RESPONSE

Click `Try It!` to start a request and see the response here!Or choose an example:

application/json

200402422

1. 
2. 

1. 
2. 
3. 
4. 
5. 
6. 
7. 
8. 
9. 
10. 
11. 
12. 
13. 
14. 
15. 
16. 
17. 
18. 
19. 
20. 
21. 
22. 
23. 
24. 
25. 
26. 
27. 
28. 
29. 
30. 
31. 
32. 
33. 
34. 
35. 
36. 
37. 
38. 
39. 
40. 
41. 
42. 
43. 
44. 
45. 
46. 
47. 
48. 
49. 
50. 
51. 
52. 
53. 
54. 
55. 
56. 
57. 
58. 
59. 
60. 
61. 
62. 
63. 
64. 
65. 
66. 
67. 
68. 
69. 
70. 
71. 
72. 
73. 
74. 
75. 
76. 
77. 
78. 
79. 
80. 
81. 
82. 
83. 
84. 
85. 
86. 
87. 
88. 
89. 
90. 
91. 
92. 
93. 
94. 
95. 
96. 
97. 
98. 
99. 
100. 
101. 
102. 
103. 
104. 
105. 
106. 
107. 
108. 
109. 
110. 
111. 
112. 
113. 
114. 
115. 
116. 
117. 
118. 
119. 
120. 
121. 
122. 
123. 
124. 
125. 
126. 
127. 
128. 
129. 
130. 
131. 
132. 
133. 
134. 
135. 
136. 
137. 
138. 
139. 
140. 
141. 
142. 
143. 
144. 
145. 
146. 
147. 
148. 
149. 
150. 
151. 
152. 
153. 
154. 
155. 
156. 
157. 

1. 
2. 
3. 
4. 
5. 
6. 
7. 
8. 
9. 
10. 
11. 
12. 
13. 
14. 
15. 
16. 
17. 
18. 
19. 
20. 
21. 
22. 
23. 
24. 
25. 
26. 
27. 
28. 
29. 
30. 
31. 
32. 
33. 
34. 
35. 
36. 
37. 
38. 
39. 
40. 
41. 
42. 
43. 
44. 

1. 
2. 
3. 
4. 
5. 
6. 
7. 
8. 
9. 
10. 
11. 
12. 
13. 
14. 
15. 
16. 
17. 
18. 
19. 
20. 
21. 
22. 
23. 
24. 
25. 
26. 
27. 
28. 
29. 
30. 
31. 
32. 
33. 
34. 
35. 
36. 
37. 
38. 
39. 
40. 
41. 
42. 
43. 
44. 
45. 
46. 
47. 
48. 
49. 
50. 
51. 
52. 
53. 
54. 
55. 
56. 
57. 
58. 
59. 
60. 
61. 
62. 
63. 
64. 
65. 
66. 
67. 
68. 
69. 
70. 
71. 
72. 
73. 
74. 
75. 
76. 
77. 
78. 
79. 
80. 
81. 
82. 
83. 
84. 
85. 
86. 
87. 
88. 
89. 
90. 
91. 
92. 
93. 

1. 
2. 
3. 
4. 
5. 
6. 
7. 
8. 
9. 
10. 
11. 
12. 
13. 
14. 
15. 
16. 
17. 
18. 
19. 
20. 
21. 
22. 
23. 
24. 
25. 
26. 
27. 
28. 

1. 
2. 
3. 
4. 
5. 
6. 
7. 
8. 
9. 
10. 
11. 
12. 
13. 
14. 
15. 
16. 
17. 
18. 
19. 
20. 
21. 
22. 
23. 
24. 
25. 
26. 
27. 
28. 
29. 
30. 
31. 
32. 

1. 
2. 
3. 
4. 
5. 

1. 
2. 
3. 
4. 
5. 
6. 


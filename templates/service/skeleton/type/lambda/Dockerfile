# Lambda thin skeleton — uses AWS base image with RIE (AD-16).
# Local test: docker run -p 9000:8080 <image>
# Invoke:     curl localhost:9000/2015-03-31/functions/function/invocations -d '{}'
FROM public.ecr.aws/lambda/nodejs:22

COPY src/ ${LAMBDA_TASK_ROOT}/src/
COPY package*.json ${LAMBDA_TASK_ROOT}/

RUN npm ci --omit=dev

CMD ["src/handler.handler"]

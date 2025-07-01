echo " build code "
imageTag="1.6.0.test"
git fetch
git pull
echo "build code"
rm -rf dist
npm run build:stage
cp -rf docker/* ./
docker login 10.120.200.35:8089
docker build -t 10.120.200.35:8089/ts/front:$imageTag  -f Dockerfile --no-cache .
docker push 10.120.200.35:8089/ts/front:$imageTag
pwd
sed -i "/spec:/,/image:/ s|image:.*|image: 10.120.200.35:8089/ts/front:$imageTag|g" tcl-front.test.yaml

kubectl delete -f tcl-front.test.yaml
kubectl apply -f tcl-front.test.yaml


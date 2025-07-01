echo " pull code "
git fetch
git pull
ehco "build code"
rm -rf dist
npm install
npm run build

cp -rf docker/* ./

docker build -t 10.120.200.35:8089/ts/front:1.0.1 -f Dockerfile --no-cache .

docker push 10.120.200.35:8089/ts/front:1.0.1

kubectl delete -f tcl-front.yaml
kubectl apply -f tcl-front.yaml

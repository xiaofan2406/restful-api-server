for f in config/*.EXAMPLE; do
cp "$f" "${f%.EXAMPLE}"
done
mkdir ./logs
npm i

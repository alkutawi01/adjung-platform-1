const fs = require('fs');
const file = './src/App.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
    /className="float-left text-5xl md:text-6xl font-light text-\\[#802334\\] mr-2 mt-1 leading-none font-serif select-none"/,
    'className="float-left text-6xl md:text-[5rem] font-light text-[#802334] mr-4 mt-2 leading-[0.8] font-serif select-none"'
);

fs.writeFileSync(file, content);

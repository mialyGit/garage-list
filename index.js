const puppeteer = require('puppeteer');
const json2xls = require('json2xls');
const fs = require('fs');
const chromePaths = require('chrome-paths')
const chalk = require('chalk');

const getAllAnnonces = async () => {
    let responses = [], index = 0;

    const browser = await puppeteer.launch({
        headless: true,
        defaultViewport: null,
        executablePath: chromePaths.chrome,
        userDataDir : './profile',
        "args": [
            "--start-maximized"
        ],
        "ignoreDefaultArgs": ["--enable-automation"]
    });

    try {  
        ids = fs.readFileSync('log.txt', 'utf8');
        init_city = parseInt(ids.split(',')[0]);
        init_nbr_page = parseInt(ids.split(',')[1]);
        init_info = parseInt(ids.split(',')[2]);
    } catch(e) {
        init_city = 0;
        init_nbr_page = 1;
        init_info = 0;
        console.log(`\n--------------------------------------- No log file found -----------------------------\n`);
    }

    try {
        responses = require('./data.json')
    } catch (error) {
        
    }

    const DEFAULT_TIMEOUT = 2000;
    // const init_page = await browser.newPage();

    // await init_page.setDefaultTimeout(0)
    // await init_page.goto('https://www.vroomly.com/villes',  {
    //     waitUntil: "networkidle2"
    // });

    // // get cities
    // const cities = await init_page.evaluate(
    //     () => Array.from(
    //         document.querySelectorAll('.row.cities h3 a'),
    //         a => "https://www.vroomly.com" + a.getAttribute('href')
    //       )
    // );

    // await init_page.waitForTimeout(DEFAULT_TIMEOUT)
    // console.log(cities);
    const cities =  [
        'https://www.vroomly.com/garage-paris/',      
        'https://www.vroomly.com/garage-marseille/',  
        'https://www.vroomly.com/garage-lyon/',       
        'https://www.vroomly.com/garage-toulouse/',   
        'https://www.vroomly.com/garage-nice/',       
        'https://www.vroomly.com/garage-nantes/',     
        'https://www.vroomly.com/garage-montpellier/',
        'https://www.vroomly.com/garage-strasbourg/', 
        'https://www.vroomly.com/garage-bordeaux/',   
        'https://www.vroomly.com/garage-lille/',      
        'https://www.vroomly.com/garage-rennes/',     
        'https://www.vroomly.com/garage-angers/',     
        'https://www.vroomly.com/garage-brest/',      
        'https://www.vroomly.com/garage-le-mans/',
        'https://www.vroomly.com/garage-amiens/',
        'https://www.vroomly.com/garage-annecy/',
        'https://www.vroomly.com/garage-dijon/',
        'https://www.vroomly.com/garage-grenoble/',
        'https://www.vroomly.com/garage-limoges/',
        'https://www.vroomly.com/garage-rouen/',
        'https://www.vroomly.com/garage-villeurbanne/',
        'https://www.vroomly.com/garage-montreuil/',
        'https://www.vroomly.com/garage-aix-en-provence/',
        'https://www.vroomly.com/garage-caen/',
        'https://www.vroomly.com/garage-clermont-ferrand/',
        'https://www.vroomly.com/garage-nancy/',
        'https://www.vroomly.com/garage-nimes/',
        'https://www.vroomly.com/garage-pau/',
        'https://www.vroomly.com/garage-pessac/'
      ]

    for (let i = init_city; i < cities.length; i++) {
        const page = await browser.newPage();
        await page.setDefaultTimeout(0)

        let nbr_page = init_nbr_page , fin = false 

        do {
            let infos =  [], j = init_info
            
            do {
                try {
                    if(nbr_page == 1)
                        await page.goto(cities[i], {waitUntil: "networkidle2"})
                    else 
                        await page.goto(cities[i]+'?page='+nbr_page, {waitUntil: "networkidle2"})

                    process.stdout.clearLine();
                    process.stdout.cursorTo(0);
                    process.stdout.write(`Lien : ${chalk.yellow(cities[i])} (${i+1}) \tPage : ${chalk.green(nbr_page)} \tInfo : ${j+1} \tDonnées : ${chalk.blue(responses.length)}`);

                } catch (error) {
                    break
                }

                try {
                    await page.waitForFunction(() => document.querySelectorAll('div[class*="__more-infos"]').length,{timeout:5000,polling:2000});
                    await page.waitForTimeout(DEFAULT_TIMEOUT)
                    infos = await page.$$('div[class*="__more-infos"]')
                } catch (error) {
                    break

                }
                
                // await page.waitForFunction((row) => document.querySelectorAll('div[class*="__more-infos"]')[row] != null, j);
                // console.log("ok");
                await scrollDownElement(page, infos[j]);
                await page.waitForTimeout(DEFAULT_TIMEOUT)

                await infos[j].click()
                await page.waitForTimeout(DEFAULT_TIMEOUT)

                await page.waitForSelector('header h1+p')
                await page.waitForSelector('a[itemprop="telephone"]')

                // try {
                //     //await page.waitForXPath('//div[contains(@class,"__tag") and contains(text(), "Non certifié")]', { hidden: true, timeout: 2000 });
                //     await page.waitForSelector('div[class*="__tag"]', { hidden: true, timeout: 2000 })
                // } catch (error) {
                //     break
                // }

                await page.waitForFunction(()=>{
                    for (const el of document.querySelectorAll('a[itemprop="telephone"]')) {
                        const arr = el.href ? el.href.split(':') : []
                        tel = arr.length > 1 ? arr[1] : arr[0]
                        return (tel != null && tel != "") 
                    }
                },{polling:2000})

                const info = await page.evaluate(()=>{
                    const name = document.querySelectorAll('header h1')[0].innerText
                    const address = document.querySelectorAll('header h1+p')[0].innerText
                    //const href = document.querySelectorAll('header h1+p+div a')[0].href
                    var tel = ""
                    for (const el of document.querySelectorAll('a[itemprop="telephone"]')) {
                        const arr = el.href ? el.href.split(':') : []
                        tel = arr.length > 1 ? arr[1] : arr[0]
                        if(tel) break
                    }
                    return {
                        "Nom du garage" : name,
                        "Adresse / CP" : address,
                        "Contact" : tel
                    }
                })

                
                fs.writeFileSync('log.txt', `${i},${nbr_page},${j}`, 'utf8');

                if(!!!(await containsObject(info, responses))) {
                    responses.push(info);
                    fs.writeFileSync('data.json', JSON.stringify(responses, null, 4), 'utf8');
                }

                j++

            } while (j < infos.length)

            init_info = 0

            try {
                await scrollDown(page,'.pagination li.disabled:last-child')
                await page.waitForSelector('.pagination li.disabled:last-child', {timeout:3000})
                fin = true
            } catch (error) {    
                nbr_page ++
            }

        } while (!fin)

        init_nbr_page = 1
        await page.close()
        // await page.evaluate(()=>{
        //     const infos = document.querySelectorAll('div[class*="__more-infos"]');
        //     for (let j = 0; j < infos.length; j++) {
        //         infos[j].click();
                
        //     }
        // })
        
    }

    await browser.close();

    convert(responses);
}

getAllAnnonces();


function getFileName() {
    const date = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    let dateFormated = date.toLocaleDateString('fr-FR', options);
    dateFormated = dateFormated.replace(/ /g, '_');
    return `Vroomly_${dateFormated}_${date.getTime()}`;
}

async function scrollDown(p,selector) {
    await p.$eval(selector, e => {
        e.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'center' });
    });
}

async function containsObject(obj, list) {

    return list.some(elem => elem["Nom du garage"] == obj["Nom du garage"] && elem["Adresse / CP"] == obj["Adresse / CP"] && elem["Contact"] == obj["Contact"])
}

async function scrollDownElement(p,el){
    await p.evaluate((e)=>{
        e.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'center' });
    }, el)
}

async function convert(json){
    
    var xls = json2xls(json);
    fs.writeFileSync(`${getFileName()}.xlsx`, xls, 'binary', (err) => {
        if (err) {
            console.log("writeFileSync error :", err);
        }
        console.log("The file has been saved!");
    });
}
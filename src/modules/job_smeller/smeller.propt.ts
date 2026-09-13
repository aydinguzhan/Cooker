

type IrowJobBlock = {
    href: string;
    text: string;
}[]



export function jobSmellerBuildPrompt(keyword: string, rawJobBlocks?: IrowJobBlock) {
    return `
    Aşağıdaki ham iş ilanı verilerini analiz et, verilerde başlık olarak ${keyword} ile uyumlu olanları yapılandırılmış JSON listesi olarak döndür.  
    Veri:
    ${JSON.stringify(rawJobBlocks, null, 2)}`


}
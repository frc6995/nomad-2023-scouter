import { type } from "@testing-library/user-event/dist/type";
import { cast, Instance, types, unprotect } from "mobx-state-tree";
import { createContext } from "react";
import { getSchedule, getTeams, getTeamsForMatch } from "./TBAInterface";

export const NumberEntry = types.model({
    value : 0,
    label: ""
})
.actions((self)=>{
    return {
        set(val: number) {
            self.value = val;
        },
        inc() {
            self.value ++;
        },
        dec() {
            if (self.value == 0 ) {
                return;
            }
            self.value--;
        }   
    }
})
.views((self)=>{
    return {
        qr() {
            return `${self.label}=${self.value}&`;
        }
    }
})

export interface INumberEntry
  extends Instance<typeof NumberEntry> {}

export const PieceListStore = types.model({
    high: NumberEntry,
    mid: NumberEntry,
    low: NumberEntry
}).views((self)=>{
    return {
        qr() {
            return self.high.qr() + self.mid.qr() + self.low.qr();
        }
    }
}).actions((self)=>{
    return {
        reset() {
            self.high.set(0);
            self.mid.set(0);
            self.low.set(0);
        }
    }
});
export interface IPieceListStore
  extends Instance<typeof PieceListStore> {}

export const Ratings = types.model({
    efficiency:0,
    control:0,
    precision:0,
    intakeCube: 0,
    intakeCone: 0,
    placeCube: 0,
    placeCone: 0
}).actions((self)=>{
    return {
        setEfficiency(val:number) { self.efficiency = val},
        setControl(val:number) { self.control = val},
        setPrecision(val:number) { self.precision = val},
        setIntakeCube(val:number) { self.intakeCube = val},
        setIntakeCone(val:number) { self.intakeCone = val},
        setPlaceCube(val:number) { self.placeCube = val},
        setPlaceCone(val:number) { self.placeCone = val},
        reset() {
            self.efficiency = self.control = self.precision = self.intakeCone = self.intakeCube = self.placeCone = self.placeCube = -1;
        }

    }
}).views((self)=>{
    return {
        qr() {
            return `re=${self.efficiency}&rc=${self.control}&rp=${self.precision}&rib=${self.intakeCube}&rin=${self.intakeCone}&rsb=${self.placeCube}&rsn=${self.placeCone}&`
        }
    }
})


export const DataStore = types
.model({
    event: types.string,
    teams: types.array(types.string),
    initials: "",
    team: "",
    match: "",
    level: "qm",
    page: 0,
    autoCones: PieceListStore,
    autoCubes: PieceListStore,
    teleCones: PieceListStore,
    teleCubes: PieceListStore,
    autoCrossed: false,
    autoClimb:0,
    teleClimb:0,

    playedDefense: false,
    rate: Ratings,
    comments: ""
})
.actions((self)=>{
    return {
    }
})
.actions((self)=>{
    return {
        reset() {
            self.team="";
            self.teams=cast([]);
            self.match="";
            self.autoCones.reset();
            self.autoCubes.reset();
            self.teleCones.reset();
            self.teleCubes.reset();
            self.autoCrossed = false;
            self.autoClimb = 0;
            self.teleClimb = 0;
            self.playedDefense = false;
            self.rate.reset();
            self.comments = "";
            self.page = 0;
            
        },
        init() {
            unprotect(self.rate);
        },
        setPlayedDefense(defense: boolean) {
            self.playedDefense = defense;
        },
        setInitials(initials:string) {
            self.initials = initials;
        },
        setEventCode(code:string) {
            self.event = code;
            getTeams(code);
            getSchedule(code);
            self.teams = cast(getTeamsForMatch(self.event, self.match, self.level));
        },
        setTeam(team:string) {
            self.team = team;
        },
        setMatch(num:string) {
            self.match = num;
            self.teams = cast(getTeamsForMatch(self.event, self.match, self.level));
            console.log(self.teams);
        },
        setUiPage(page : number) {
            self.page = page;
        },
        nextPage() {
            self.page = (self.page + 1) % 5;
        },
        prevPage() {
            self.page = (self.page - 1) % 5;
            if (self.page == -1) {
                self.page = 4;
            }
            console.log(self.page)
        },
        setAutoCross(autoCross: boolean) {
            self.autoCrossed = autoCross
        },
        setAutoClimb(autoClimb:number) {
            self.autoClimb = autoClimb
        },
        setTeleClimb(teleClimb:number) {
            self.teleClimb = teleClimb
        },
        setComments(comments: string) {
            self.comments = comments;
        },

    }
})
.views((self)=>{
    return{
        qr() {
            
            var text = "";
            // match info
            text += `i=${self.initials}&t=${self.team}&m=${self.match}&l=${self.level}&`;
            // auto
            text += self.autoCones.qr() + self.autoCubes.qr();
            text += `am=${self.autoCrossed ? 1 : 0}&acs=${self.autoClimb}&`
            text += self.teleCones.qr() + self.teleCubes.qr();
            text += `pd=${self.playedDefense ? 1 : 0}&tcs=${self.teleClimb}&`
            text += self.rate.qr();

            var comments = self.comments.replaceAll('\n', "|").replaceAll('&', "[and]").replaceAll('=', '[equals]');
            text += `comments=${comments}&`
            //console.log(text)
            return text;
        }
    }

})



export class DocumentManager {
    data = DataStore.create({
        event: "2023nvlv",
        autoCones: PieceListStore.create({
            high:{label:"ahn"},
            mid:{label: "amn"},
            low:{label: "aln"}}),
        autoCubes: PieceListStore.create({
                high:{label:"ahb"},
                mid:{label: "amb"},
                low:{label: "alb"}}),
        teleCones: PieceListStore.create({
            high:{label:"thn"},
            mid:{label: "tmn"},
            low:{label: "tln"}}),
        teleCubes: PieceListStore.create({
            high:{label:"thb"},
            mid:{label: "tmb"},
            low:{label: "tlb"}}),
        rate: Ratings.create({}),
        comments: ""
    });
}

let DocumentManagerContext = createContext(new DocumentManager());
export default DocumentManagerContext;